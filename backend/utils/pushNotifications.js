const webpush = require("web-push");
const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Lab = require("../models/Lab");
const { ROLES } = require("./roles");

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey && process.env.VAPID_SUBJECT);

if (pushConfigured) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, vapidPublicKey, vapidPrivateKey);
}

const getVapidPublicKey = () => vapidPublicKey;

const getNotificationUrl = (role) => {
  switch (role) {
    case ROLES.DOCTOR:
      return "/doctor-dashboard";
    case ROLES.STAFF:
      return "/staff-dashboard";
    case ROLES.LABORATORY:
      return "/laboratory-dashboard";
    case ROLES.SUPER_ADMIN:
      return "/admin-dashboard";
    default:
      return "/patient-dashboard";
  }
};

const sendPush = async (notification) => {
  if (!pushConfigured || !notification?.userId) return;

  const user = await User.findById(notification.userId).select("role").lean();
  const subscriptions = await PushSubscription.find({ userId: notification.userId }).lean();
  const url = notification.data?.url || getNotificationUrl(user?.role);
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    notificationId: String(notification._id),
    appointmentId: notification.appointmentId ? String(notification.appointmentId) : "",
    url,
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

  const users = await User.find({ _id: { $in: uniqueUserIds } }).select("_id role").lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const notifications = await Notification.insertMany(uniqueUserIds.map((userId) => {
    const user = userById.get(String(userId));
    return {
      userId,
      title: user?.role === ROLES.PATIENT ? "Appointment confirmed" : title,
      message: user?.role === ROLES.PATIENT
        ? `Your appointment is confirmed. ${message}`
        : message,
      type,
      appointmentId,
      data: { ...data, url: getNotificationUrl(user?.role) },
    };
  }));
  await Promise.all(notifications.map((notification) => sendPush(notification)));
  return notifications;
};

const getAppointmentRecipientIds = async (appointment) => {
  const ids = [];
  const appointmentDoctorId = appointment.doctorId?._id || appointment.doctorId || null;
  const appointmentLabId = appointment.labId?._id || appointment.labId || null;

  if (appointment.patientId) ids.push(appointment.patientId._id || appointment.patientId);

  if (appointmentDoctorId) {
    const doctor = await Doctor.findById(appointmentDoctorId).select("userId").lean();
    if (doctor?.userId) ids.push(doctor.userId);
  }

  if (appointmentLabId) {
    const lab = await Lab.findById(appointmentLabId).select("userId").lean();
    if (lab?.userId) ids.push(lab.userId);
  }

  // Doctor bookings notify only staff assigned to that doctor. Lab bookings
  // notify the selected laboratory account and never broadcast to staff.
  if (appointmentDoctorId) {
    const staffFilter = {
      role: ROLES.STAFF,
      isActive: { $ne: false },
      doctorId: appointmentDoctorId,
    };
    const staff = await User.find(staffFilter).select("_id").lean();
    ids.push(...staff.map((item) => item._id));
  }
  return ids;
};

const notifyAppointmentCreated = async (appointment) => {
  const recipientIds = await getAppointmentRecipientIds(appointment);
  const target = appointment.doctorId?.name || appointment.labId?.name || "your provider";
  return createNotifications({
    userIds: recipientIds,
    title: "New appointment booked",
    message: `${appointment.patientName} booked ${target} for ${appointment.appointmentDate}. Queue #${appointment.queueNumber || "-"}; expected visit around ${appointment.appointmentTime}.`,
    appointmentId: appointment._id,
    data: { event: "created" },
  });
};

const notifyAppointmentUpdated = async (previous, updated) => {
  const changedStatus = previous.status !== updated.status;
  const changedSchedule = previous.appointmentDate !== updated.appointmentDate || previous.appointmentTime !== updated.appointmentTime;
  if (!changedStatus && !changedSchedule) return [];

  const recipientIds = await getAppointmentRecipientIds(updated);
  const details = changedStatus && changedSchedule
    ? `Your appointment status is now ${updated.status}. The expected visit time is ${updated.appointmentDate} at ${updated.appointmentTime}.`
    : changedStatus
      ? `Your appointment status is now ${updated.status}.`
      : `Your appointment is scheduled for ${updated.appointmentDate}; expected visit around ${updated.appointmentTime}.`;

  return createNotifications({
    userIds: recipientIds,
    title: changedSchedule ? "Appointment time updated" : "Appointment status updated",
    message: `${details} Patient: ${updated.patientName}.`,
    appointmentId: updated._id,
    data: { event: changedSchedule ? "schedule" : "status" },
  });
};

module.exports = {
  createNotifications,
  getVapidPublicKey,
  notifyAppointmentCreated,
  notifyAppointmentUpdated,
};
