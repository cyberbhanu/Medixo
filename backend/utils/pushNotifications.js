const webpush = require("web-push");
const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Lab = require("../models/Lab");
const { ROLES } = require("./roles");

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
const vapidSubject = process.env.VAPID_SUBJECT?.trim() || "";
const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

if (pushConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const getVapidPublicKey = () => vapidPublicKey;
const isPushConfigured = () => pushConfigured;

const getNotificationUrl = (role) => {
  switch (role) {
    case ROLES.DOCTOR:
      return "/doctor-dashboard#doctor-patient-queue";
    case ROLES.STAFF:
      return "/staff-dashboard#staff-patient-queue";
    case ROLES.LABORATORY:
      return "/laboratory-dashboard";
    case ROLES.SUPER_ADMIN:
      return "/admin-dashboard";
    case ROLES.HOSPITAL:
      return "/hospital-dashboard";
    default:
      return "/patient-dashboard#upcoming-appointments";
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

  await Promise.all(
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
          return;
        }
        console.error("Push notification delivery failed:", {
          notificationId: String(notification._id),
          subscriptionId: String(item._id),
          statusCode: error.statusCode || null,
          message: error.message,
        });
      }
    })
  );
};

const createNotifications = async ({
  userIds,
  title,
  message,
  patientTitle = title,
  patientMessage = message,
  type = "appointment",
  appointmentId = null,
  data = {},
}) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (!uniqueUserIds.length) return [];

  const users = await User.find({ _id: { $in: uniqueUserIds } }).select("_id role").lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const notifications = await Notification.insertMany(uniqueUserIds.map((userId) => {
    const user = userById.get(String(userId));
    return {
      userId,
      title: user?.role === ROLES.PATIENT ? patientTitle : title,
      message: user?.role === ROLES.PATIENT ? patientMessage : message,
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
  const clinicIds = new Set();
  const hospitalIds = new Set();
  const addFacilityId = (collection, value) => {
    const id = value?._id || value;
    if (id) collection.add(String(id));
  };

  addFacilityId(clinicIds, appointment.clinic);
  addFacilityId(hospitalIds, appointment.hospital);

  if (appointment.patientId) ids.push(appointment.patientId._id || appointment.patientId);

  if (appointmentDoctorId) {
    const doctor = await Doctor.findById(appointmentDoctorId)
      .select("userId clinic clinics hospital hospitals")
      .lean();
    if (doctor?.userId) ids.push(doctor.userId);
    if (!clinicIds.size) {
      [doctor?.clinic, ...(doctor?.clinics || [])].forEach((id) => addFacilityId(clinicIds, id));
    }
    if (!hospitalIds.size) {
      [doctor?.hospital, ...(doctor?.hospitals || [])].forEach((id) => addFacilityId(hospitalIds, id));
    }
  }

  if (appointmentLabId) {
    const lab = await Lab.findById(appointmentLabId).select("userId").lean();
    if (lab?.userId) ids.push(lab.userId);
  }

  if (appointmentDoctorId) {
    const assignments = [{ doctorId: appointmentDoctorId }];
    if (clinicIds.size) assignments.push({ clinicId: { $in: [...clinicIds] } });
    if (hospitalIds.size) assignments.push({ hospitalId: { $in: [...hospitalIds] } });

    const staff = await User.find({
      role: ROLES.STAFF,
      isActive: { $ne: false },
      $or: assignments,
    }).select("_id").lean();
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
    patientTitle: "Appointment request received",
    patientMessage: `Your appointment with ${target} is scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}. Queue #${appointment.queueNumber || "-"}.`,
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
    patientTitle: changedSchedule ? "Appointment time updated" : "Appointment status updated",
    patientMessage: details,
    appointmentId: updated._id,
    data: { event: changedSchedule ? "schedule" : "status" },
  });
};

module.exports = {
  createNotifications,
  getVapidPublicKey,
  isPushConfigured,
  notifyAppointmentCreated,
  notifyAppointmentUpdated,
};
