const router = require("express").Router();
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Lab = require("../models/Lab");
const { authenticateUser } = require("../middleware/auth");
const { ROLES, hasRole } = require("../utils/roles");

const VALID_STATUSES = ["Scheduled", "Approved", "Rejected", "Completed", "Cancelled", "Rescheduled"];
const VALID_GENDERS = ["Male", "Female", "Other"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;
const EDITABLE_FIELDS = [
  "patientName",
  "patientEmail",
  "patientPhone",
  "patientAge",
  "patientGender",
  "appointmentDate",
  "appointmentTime",
  "status",
  "reason",
  "disease",
  "treatmentPlan",
  "prescription",
  "prescriptionUrl",
  "labReferral",
  "paymentStatus",
  "testName",
  "reportUrl",
  "notes",
];
const PATIENT_EDITABLE_FIELDS = ["appointmentDate", "appointmentTime", "status", "notes"];
const LAB_EDITABLE_FIELDS = ["status", "reportUrl", "notes"];
const ACTIVE_SLOT_STATUSES = ["Scheduled", "Approved", "Rescheduled"];

const isValidDateString = (date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
const isValidTimeString = (time) => /^\d{2}:\d{2}$/.test(String(time || ""));

const getAppointmentDateTime = (appointmentDate, appointmentTime) =>
  new Date(`${appointmentDate}T${appointmentTime}:00`);

const isPastAppointment = (appointmentDate, appointmentTime) => {
  const appointmentDateTime = getAppointmentDateTime(appointmentDate, appointmentTime);

  return Number.isNaN(appointmentDateTime.getTime()) || appointmentDateTime.getTime() < Date.now();
};

const getSlotConflictFilter = ({ doctorId, labId, type, appointmentDate, appointmentTime, excludeId }) => {
  const filter = {
    type: type || "doctor",
    appointmentDate,
    appointmentTime,
    status: { $in: ACTIVE_SLOT_STATUSES },
  };

  if (type === "lab") {
    filter.labId = labId;
  } else {
    filter.doctorId = doctorId;
  }

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return filter;
};

const validateAppointmentPayload = ({
  doctorId,
  labId,
  type,
  patientName,
  patientEmail,
  patientPhone,
  patientAge,
  patientGender,
  appointmentDate,
  appointmentTime,
  reason,
  status,
  paymentStatus,
}) => {
  const isLab = type === "lab";
  if (
    (!isLab && !doctorId) ||
    (isLab && !labId) ||
    !patientName ||
    !patientEmail ||
    !patientPhone ||
    patientAge === undefined ||
    !appointmentDate ||
    !appointmentTime ||
    !reason
  ) {
    return "Target (Doctor/Lab), patient, phone, age, date, time, and reason are required";
  }

  if (!isLab && !mongoose.Types.ObjectId.isValid(doctorId)) {
    return "Please select a valid doctor";
  }

  if (isLab && !mongoose.Types.ObjectId.isValid(labId)) {
    return "Please select a valid lab";
  }

  if (!EMAIL_REGEX.test(patientEmail.trim().toLowerCase())) {
    return "Please provide a valid patient email address";
  }

  if (!PHONE_REGEX.test(patientPhone.trim())) {
    return "Please provide a valid patient phone number";
  }

  if (Number.isNaN(Number(patientAge)) || Number(patientAge) <= 0 || Number(patientAge) > 120) {
    return "Please provide a valid patient age between 1 and 120";
  }

  if (!isValidDateString(appointmentDate)) {
    return "Please provide a valid appointment date";
  }

  if (!isValidTimeString(appointmentTime)) {
    return "Please provide a valid appointment time";
  }

  if (status !== "Cancelled" && isPastAppointment(appointmentDate, appointmentTime)) {
    return "Appointment date and time must be in the future";
  }

  if (patientGender && !VALID_GENDERS.includes(patientGender)) {
    return "Invalid patient gender selected";
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return "Invalid appointment status selected";
  }

  if (paymentStatus && !["Pending", "Paid", "Failed", "Refunded"].includes(paymentStatus)) {
    return "Invalid payment status selected";
  }

  return null;
};

const ensureSlotIsAvailable = async (appointmentPayload, excludeId = null) => {
  if (!ACTIVE_SLOT_STATUSES.includes(appointmentPayload.status || "Scheduled")) {
    return null;
  }

  const conflict = await Appointment.exists(
    getSlotConflictFilter({
      ...appointmentPayload,
      excludeId,
    })
  );

  return conflict ? "This appointment slot is already booked. Please choose another time." : null;
};

const buildAppointmentPayload = (body) => ({
  doctorId: body.doctorId || null,
  labId: body.labId || null,
  type: body.type || "doctor",
  referredBy: body.referredBy || null,
  patientId: body.patientId || null,
  patientName: body.patientName.trim(),
  patientEmail: body.patientEmail.trim().toLowerCase(),
  patientPhone: body.patientPhone.trim(),
  patientAge: Number(body.patientAge),
  patientGender: body.patientGender || "Other",
  appointmentDate: body.appointmentDate.trim(),
  appointmentTime: body.appointmentTime.trim(),
  status: body.status || "Scheduled",
  reason: body.reason.trim(),
  disease: body.disease?.trim() || "",
  treatmentPlan: body.treatmentPlan?.trim() || "",
  prescription: body.prescription?.trim() || "",
  prescriptionUrl: body.prescriptionUrl?.trim() || "",
  labReferral: body.labReferral || null,
  paymentStatus: body.paymentStatus || "Pending",
  testName: body.testName?.trim() || "",
  reportUrl: body.reportUrl?.trim() || "",
  notes: body.notes?.trim() || "",
});

const getDoctorProfileForUser = async (user) =>
  Doctor.findOne({
    $or: [{ userId: user.id }, { email: user.email }],
  });

const getLabProfileForUser = async (user) =>
  Lab.findOne({
    $or: [{ userId: user.id }, { email: user.email }],
  });

const getAppointmentTimestamp = (appointment) =>
  new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`).getTime();

const attachQueueDetails = (appointments) => {
  const queueMap = new Map();

  const sortedForQueue = [...appointments].sort((left, right) => {
    const leftTime = getAppointmentTimestamp(left);
    const rightTime = getAppointmentTimestamp(right);

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  sortedForQueue.forEach((appointment) => {
    if (appointment.status === "Cancelled") {
      return;
    }

    const targetId = appointment.type === 'lab' ? (appointment.labId?._id || appointment.labId) : (appointment.doctorId?._id || appointment.doctorId);
    const queueKey = `${targetId}-${appointment.appointmentDate}`;
    const nextQueueNumber = (queueMap.get(queueKey) || 0) + 1;
    queueMap.set(queueKey, nextQueueNumber);
    appointment.queueNumber = nextQueueNumber;
  });

  const totalsByQueueKey = new Map();
  sortedForQueue.forEach((appointment) => {
    const targetId = appointment.type === 'lab' ? (appointment.labId?._id || appointment.labId) : (appointment.doctorId?._id || appointment.doctorId);
    const queueKey = `${targetId}-${appointment.appointmentDate}`;
    if (appointment.queueNumber) {
      totalsByQueueKey.set(queueKey, (totalsByQueueKey.get(queueKey) || 0) + 1);
    }
  });

  return appointments
    .map((appointment) => {
      const targetId = appointment.type === 'lab' ? (appointment.labId?._id || appointment.labId) : (appointment.doctorId?._id || appointment.doctorId);
      const queueKey = `${targetId}-${appointment.appointmentDate}`;
      const dailyQueueSize = totalsByQueueKey.get(queueKey) || 0;

      return {
        ...appointment,
        queueNumber: appointment.queueNumber || null,
        dailyQueueSize,
        patientsAhead: appointment.queueNumber ? appointment.queueNumber - 1 : null,
      };
    })
    .sort((left, right) => getAppointmentTimestamp(left) - getAppointmentTimestamp(right));
};

router.use(authenticateUser);

router.get("/", async (_req, res) => {
  try {
    const filters = {};

    if (hasRole(_req.user, ROLES.SUPER_ADMIN)) {
      if (_req.query.doctorId) {
        filters.doctorId = _req.query.doctorId;
      }

      if (_req.query.patientId) {
        filters.patientId = _req.query.patientId;
      }

      if (_req.query.patientEmail) {
        filters.patientEmail = _req.query.patientEmail.trim().toLowerCase();
      }
    } else if (hasRole(_req.user, ROLES.DOCTOR)) {
      const doctorProfile = await getDoctorProfileForUser(_req.user);

      if (!doctorProfile) {
        return res.json([]);
      }

      filters.doctorId = doctorProfile._id;
    } else if (hasRole(_req.user, ROLES.LABORATORY)) {
      const labProfile = await getLabProfileForUser(_req.user);

      if (!labProfile) {
        return res.json([]);
      }

      filters.type = "lab";
      filters.labId = labProfile._id;
    } else {
      filters.$or = [
        { patientId: _req.user.id },
        { patientEmail: _req.user.email },
      ];
    }

    const appointments = await Appointment.find(filters)
      .populate("doctorId", "name specialization location fees userId email")
      .populate("labId", "name location email")
      .populate("referredBy", "name")
      .populate("patientId", "name email role")
      .sort({ createdAt: -1 });

    const appointmentsWithQueue = attachQueueDetails(
      appointments.map((appointment) => appointment.toObject())
    );

    res.json(appointmentsWithQueue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const isSuperAdmin = hasRole(req.user, ROLES.SUPER_ADMIN);
    const isPatient = hasRole(req.user, ROLES.PATIENT);
    const isDoctor = hasRole(req.user, ROLES.DOCTOR);

    if (!isPatient && !isSuperAdmin && !isDoctor) {
      return res.status(403).json({ error: "You are not allowed to create appointments" });
    }

    if (isDoctor && req.body.type !== "lab") {
      return res.status(403).json({ error: "Doctors can only create laboratory referrals" });
    }

    const referringDoctor = isDoctor ? await getDoctorProfileForUser(req.user) : null;
    if (isDoctor && !referringDoctor) {
      return res.status(403).json({ error: "Doctor profile is required to create lab referrals" });
    }

    const requestBody =
      isPatient
        ? {
            ...req.body,
            patientId: req.user.id,
            patientName: req.user.name,
            patientEmail: req.user.email,
            status: "Scheduled",
          }
        : {
            ...req.body,
            referredBy: isDoctor ? referringDoctor._id : req.body.referredBy,
          };

    const validationError = validateAppointmentPayload(requestBody);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (requestBody.type !== 'lab') {
      const doctor = await Doctor.findById(requestBody.doctorId);
      if (!doctor || doctor.isActive === false) {
        return res.status(404).json({ error: "Selected doctor was not found" });
      }
    } else {
      const lab = await Lab.findById(requestBody.labId);
      if (!lab || lab.isActive === false) {
        return res.status(404).json({ error: "Selected laboratory was not found" });
      }
    }

    const slotError = await ensureSlotIsAvailable(requestBody);
    if (slotError) {
      return res.status(409).json({ error: slotError });
    }

    const matchingPatient = await User.findOne({
      email: requestBody.patientEmail.trim().toLowerCase(),
    });

    const appointment = new Appointment(
      buildAppointmentPayload({
        ...requestBody,
        patientId:
          isPatient ? req.user.id : matchingPatient?._id || null,
      })
    );
    await appointment.save();
    if (appointment.doctorId) {
      await Doctor.findByIdAndUpdate(appointment.doctorId, {
        $addToSet: {
          appointmentIds: appointment._id,
          ...(appointment.patientId ? { patientIds: appointment.patientId } : {}),
        },
      }).catch(() => null);
    }
    if (appointment.labId) {
      await Lab.findByIdAndUpdate(appointment.labId, {
        $addToSet: { bookings: appointment._id, appointments: appointment._id },
      }).catch(() => null);
    }
    if (appointment.referredBy) {
      await Doctor.findByIdAndUpdate(appointment.referredBy, {
        $addToSet: { labReferrals: appointment._id },
      }).catch(() => null);
    }
    await appointment.populate("doctorId", "name specialization location fees userId email");
    await appointment.populate("labId", "name location email");
    await appointment.populate("referredBy", "name");
    await appointment.populate("patientId", "name email role");

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (hasRole(req.user, ROLES.SUPER_ADMIN)) {
      // Admins can update any appointment.
    } else if (hasRole(req.user, ROLES.DOCTOR)) {
      const doctorProfile = await getDoctorProfileForUser(req.user);
      const isAssignedDoctor = doctorProfile && String(doctorProfile._id) === String(appointment.doctorId);

      if (!isAssignedDoctor) {
        return res.status(403).json({ error: "You can only update appointments assigned to your profile" });
      }
    } else if (hasRole(req.user, ROLES.LABORATORY)) {
      const labProfile = await getLabProfileForUser(req.user);
      const isAssignedLab = labProfile && String(labProfile._id) === String(appointment.labId);
      const requestedFields = Object.keys(req.body).filter((field) =>
        EDITABLE_FIELDS.includes(field)
      );
      const hasOnlyLabFields = requestedFields.every((field) =>
        LAB_EDITABLE_FIELDS.includes(field)
      );

      if (!isAssignedLab || appointment.type !== "lab") {
        return res.status(403).json({ error: "You can only manage tests assigned to your laboratory" });
      }

      if (!hasOnlyLabFields) {
        return res.status(403).json({ error: "Laboratories can only update test status, reports, and notes" });
      }
    } else if (hasRole(req.user, ROLES.PATIENT)) {
      const isOwnAppointment =
        String(appointment.patientId || "") === req.user.id ||
        appointment.patientEmail === req.user.email;
      const requestedFields = Object.keys(req.body).filter((field) =>
        EDITABLE_FIELDS.includes(field)
      );
      const hasOnlyPatientFields = requestedFields.every((field) =>
        PATIENT_EDITABLE_FIELDS.includes(field)
      );

      if (!isOwnAppointment) {
        return res.status(403).json({ error: "You can only manage your own appointments" });
      }

      if (!hasOnlyPatientFields) {
        return res.status(403).json({ error: "Patients can only cancel or reschedule appointments" });
      }

      if (req.body.status && !["Cancelled", "Rescheduled"].includes(req.body.status)) {
        return res.status(400).json({ error: "Patients can only cancel or reschedule appointments" });
      }
    } else {
      return res.status(403).json({ error: "You are not allowed to update appointments" });
    }

    const sanitizedPayload = {};

    EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] === undefined) {
        return;
      }

      if (field === "patientEmail") {
        sanitizedPayload.patientEmail = String(req.body[field]).trim().toLowerCase();
      } else if (field === "patientAge") {
        sanitizedPayload.patientAge = Number(req.body[field]);
      } else if (
        field === "patientName" ||
        field === "patientPhone" ||
        field === "appointmentDate" ||
        field === "appointmentTime" ||
        field === "reason" ||
        field === "disease" ||
        field === "treatmentPlan" ||
        field === "prescription" ||
        field === "prescriptionUrl" ||
        field === "testName" ||
        field === "reportUrl" ||
        field === "notes"
      ) {
        sanitizedPayload[field] = String(req.body[field]).trim();
      } else {
        sanitizedPayload[field] = req.body[field];
      }
    });

    if (
      hasRole(req.user, ROLES.PATIENT) &&
      (sanitizedPayload.appointmentDate || sanitizedPayload.appointmentTime) &&
      sanitizedPayload.status !== "Cancelled"
    ) {
      sanitizedPayload.status = "Rescheduled";
    }

    const validationError = validateAppointmentPayload({
      ...appointment.toObject(),
      ...sanitizedPayload,
      status: sanitizedPayload.status || appointment.status,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const slotError = await ensureSlotIsAvailable(
      {
        ...appointment.toObject(),
        ...sanitizedPayload,
        status: sanitizedPayload.status || appointment.status,
      },
      appointment._id
    );

    if (slotError) {
      return res.status(409).json({ error: slotError });
    }

    const matchingPatient = await User.findOne({
      email: sanitizedPayload.patientEmail?.trim().toLowerCase() || appointment.patientEmail,
    });

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        ...sanitizedPayload,
        patientId: matchingPatient?._id || appointment.patientId || null,
      },
      { new: true, runValidators: true }
    )
      .populate("doctorId", "name specialization location fees userId email")
      .populate("labId", "name location email")
      .populate("referredBy", "name")
      .populate("patientId", "name email role");

    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
