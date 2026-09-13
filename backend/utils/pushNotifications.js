const webpush = require("web-push");
const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { ROLES } = require("./roles");

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey && process.env.VAPID_SUBJECT);

if (pushConfigured) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, vapidPublicKey, vapidPrivateKey);
}

const getVapidPublicKey = () => vapidPublicKey;

const sendPush = async (notification, userIds) => {
  if (!pushConfigured || !userIds.length) return;

  const subscriptions = await PushSubscription.find({ userId: { $in: userIds } }).lean();
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    notificationId: String(notification._id),
    appointmentId: notification.appointmentId ? String(notification.appointmentId) : "",
    url: "/patient-dashboard",
  });

  await Promise.allSettled(
    subscriptions.map(async (item) => {
      try {
        await webpush.sendNotification(
          { endpoint: item.endpoint, keys: item.keys },
          payload
        );
        await PushSubscription.updateOne(
          { _id: item._id },
          { $set: { lastUsedAt: new Date() } }
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: item._id });
        }
      }
    })
  );
};

const createNotifications = async ({ userIds, title, message, type = "appointment", appointmentId = null, data = {} }) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (!uniqueUserIds.length) return [];

  const notifications = await Notification.insertMany(
    uniqueUserIds.map((userId) => ({ userId, title, message, type, appointmentId, data }))
  );
  await sendPush(notifications[0], uniqueUserIds);
  return notifications;
};

const getAppointmentRecipientIds = async (appointment) => {
  const ids = [];
  const appointmentDoctorId = appointment.doctorId?._id || appointment.doctorId || null;

  if (appointment.patientId) ids.push(appointment.patientId._id || appointment.patientId);

  if (appointmentDoctorId) {
    const doctor = await Doctor.findById(appointmentDoctorId).select("userId").lean();
    if (doctor?.userId) ids.push(doctor.userId);
  }

  // Staff notifications must follow the doctor's assignment made by admin.
  // Never broadcast a doctor's booking to staff assigned to other doctors.
  const staffFilter = {
    role: ROLES.STAFF,
    isActive: { $ne: false },
    doctorId: appointmentDoctorId,
  };
  const staff = await User.find(staffFilter).select("_id").lean();
  ids.push(...staff.map((item) => item._id));
  return ids;
};

const notifyAppointmentCreated = async (appointment) => {
  const recipientIds = await getAppointmentRecipientIds(appointment);
  const target = appointment.doctorId?.name || appointment.labId?.name || "your provider";
  return createNotifications({
    userIds: recipientIds,
    title: "New appointment booked",
    message: `${appointment.patientName} booked ${target} for ${appointment.appointmentDate} at ${appointment.appointmentTime}. Queue #${appointment.queueNumber || "-"}.`,
    appointmentId: appointment._id,
    data: { event: "created" },
  });
};

const notifyAppointmentUpdated = async (previous, updated) => {
  const changedStatus = previous.status !== updated.status;
  const changedSchedule = previous.appointmentDate !== updated.appointmentDate || previous.appointmentTime !== updated.appointmentTime;
  if (!changedStatus && !changedSchedule) return [];

  const recipientIds = await getAppointmentRecipientIds(updated);
  const details = changedStatus
    ? `Your appointment status is now ${updated.status}.`
    : `Your appointment is scheduled for ${updated.appointmentDate} at ${updated.appointmentTime}.`;

  return createNotifications({
    userIds: recipientIds,
    title: changedStatus ? "Appointment status updated" : "Appointment time updated",
    message: `${details} Patient: ${updated.patientName}.`,
    appointmentId: updated._id,
    data: { event: changedStatus ? "status" : "schedule" },
  });
};

module.exports = {
  createNotifications,
  getVapidPublicKey,
  notifyAppointmentCreated,
  notifyAppointmentUpdated,
};
