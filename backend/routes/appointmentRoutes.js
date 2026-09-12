const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Lab = require("../models/Lab");
const { authenticateUser } = require("../middleware/auth");
const { ROLES, hasRole } = require("../utils/roles");
const { getJwtSecret } = require("../utils/jwt");

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
  "patientWeight",
  "patientAddress",
  "bloodPressure",
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
const SLOT_ALREADY_BOOKED_MESSAGE =
  "This appointment slot is already booked. Please choose another time.";

const generateBookingReference = () =>
  `MX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const generateBookingPassword = () => crypto.randomBytes(4).toString("hex").toUpperCase();

const guestAppointmentFields = [
  "_id",
  "type",
  "doctorId",
  "labId",
  "patientName",
  "patientEmail",
  "patientPhone",
  "patientAge",
  "patientGender",
  "appointmentDate",
  "appointmentTime",
  "status",
  "reason",
  "notes",
  "bookingReference",
  "queueNumber",
  "dailyQueueSize",
  "patientsAhead",
  "createdAt",
];

const populateAppointment = (query) =>
  query
    .populate("doctorId", "name specialization location fees")
    .populate("labId", "name location")
    .populate("clinic", "name city state address phone")
    .populate("hospital", "name city state address phone")
    .populate("department", "name");

const sanitizeGuestAppointment = (appointment) => {
  const data = appointment?.toObject ? appointment.toObject() : { ...appointment };
  delete data.bookingPasswordHash;
  return data;
};

const authenticateGuestBooking = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Booking access is required" });
    }

    const payload = jwt.verify(token, getJwtSecret());
    if (payload.type !== "guest_booking" || String(payload.id) !== String(req.params.id)) {
      return res.status(401).json({ error: "Invalid booking access" });
    }

    const appointment = await populateAppointment(
      Appointment.findById(req.params.id).select(guestAppointmentFields.join(" "))
    );
    if (!appointment || appointment.bookingReference !== payload.bookingReference) {
      return res.status(404).json({ error: "Booking not found" });
    }

    req.guestAppointment = appointment;
    next();
  } catch (_error) {
    return res.status(401).json({ error: "Booking access has expired. Please enter your booking ID and password again." });
  }
};

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

  return conflict ? SLOT_ALREADY_BOOKED_MESSAGE : null;
};

const isDuplicateSlotError = (error) => error?.code === 11000;

const sendAppointmentWriteError = (res, error) => {
  if (isDuplicateSlotError(error)) {
    return res.status(409).json({
      error: SLOT_ALREADY_BOOKED_MESSAGE,
    });
  }

  return res.status(400).json({
    error: error.message,
  });
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
  patientWeight: body.patientWeight?.trim() || "",
  patientAddress: body.patientAddress?.trim() || "",
  bloodPressure: body.bloodPressure?.trim() || "",
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

const getQueueDetailsForAppointment = async (appointment) => {
  const queueFilter = {
    type: appointment.type,
    appointmentDate: appointment.appointmentDate,
    status: { $in: ACTIVE_SLOT_STATUSES },
  };

  if (appointment.type === "lab") {
    queueFilter.labId = appointment.labId?._id || appointment.labId;
  } else {
    queueFilter.doctorId = appointment.doctorId?._id || appointment.doctorId;
  }

  const queueAppointments = await Appointment.find(queueFilter)
    .select("_id type doctorId labId appointmentDate appointmentTime createdAt status")
    .lean();

  return attachQueueDetails(queueAppointments).find(
    (item) => String(item._id) === String(appointment._id)
  );
};

const attachQueueDetails = (appointments) => {
  const queueMap = new Map();

  const sortedForQueue = [...appointments].sort((left, right) => {
    const leftCreatedAt = new Date(left.createdAt).getTime();
    const rightCreatedAt = new Date(right.createdAt).getTime();

    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return String(left._id).localeCompare(String(right._id));
  });

  sortedForQueue.forEach((appointment) => {
    if (!ACTIVE_SLOT_STATUSES.includes(appointment.status)) {
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
    .sort((left, right) => {
      const dateDifference = String(left.appointmentDate || "").localeCompare(String(right.appointmentDate || ""));
      if (dateDifference) return dateDifference;

      const leftQueue = left.queueNumber || Number.MAX_SAFE_INTEGER;
      const rightQueue = right.queueNumber || Number.MAX_SAFE_INTEGER;
      if (leftQueue !== rightQueue) return leftQueue - rightQueue;

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
};

router.post("/guest", async (req, res) => {
  let createdPatient = null;

  try {
    const requestBody = {
      ...req.body,
      type: "doctor",
      status: "Scheduled",
      patientId: null,
    };
    const validationError = validateAppointmentPayload(requestBody);
    if (validationError) return res.status(400).json({ error: validationError });

    const doctor = await Doctor.findById(requestBody.doctorId);
    if (!doctor || doctor.isActive === false) {
      return res.status(404).json({ error: "Selected doctor was not found" });
    }

    const slotError = await ensureSlotIsAvailable(requestBody);
    if (slotError) return res.status(409).json({ error: slotError });

    const bookingReference = generateBookingReference();
    const bookingPassword = generateBookingPassword();
    const normalizedEmail = requestBody.patientEmail.trim().toLowerCase();
    let patientUser = await User.findOne({ email: normalizedEmail });

    if (patientUser && patientUser.role !== ROLES.PATIENT) {
      return res.status(409).json({ error: "This email is already assigned to a staff or provider account" });
    }

    if (!patientUser) {
      patientUser = new User({
        name: requestBody.patientName.trim(),
        email: normalizedEmail,
        password: bookingPassword,
        role: ROLES.PATIENT,
        patientId: bookingReference,
        phone: requestBody.patientPhone.trim(),
        gender: requestBody.patientGender || "Other",
      });
      await patientUser.save();
      createdPatient = patientUser;
    } else if (!patientUser.patientId) {
      patientUser.patientId = bookingReference;
      await patientUser.save();
    }

    const appointment = new Appointment({
      ...buildAppointmentPayload(requestBody),
      patientId: patientUser._id,
      bookingReference,
      bookingPasswordHash: await bcrypt.hash(bookingPassword, 10),
    });
    await appointment.save();

    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      $addToSet: { appointmentIds: appointment._id },
    }).catch(() => null);

    const populatedAppointment = await populateAppointment(
      Appointment.findById(appointment._id)
    );
    const queueDetails = await getQueueDetailsForAppointment(appointment);

    return res.status(201).json({
      message: "Appointment booked successfully",
      bookingReference,
      bookingPassword,
      patientLoginId: patientUser.patientId,
      patientLoginPassword: createdPatient ? bookingPassword : null,
      patientAccountExists: !createdPatient,
      appointment: {
        ...sanitizeGuestAppointment(populatedAppointment),
        queueNumber: queueDetails?.queueNumber || null,
        dailyQueueSize: queueDetails?.dailyQueueSize || 0,
        patientsAhead: queueDetails?.patientsAhead ?? null,
      },
    });
  } catch (error) {
    if (createdPatient?._id) {
      await User.findByIdAndDelete(createdPatient._id).catch(() => null);
    }
    return sendAppointmentWriteError(res, error);
  }
});

router.post("/guest/access", async (req, res) => {
  try {
    const bookingReference = String(req.body.bookingReference || "").trim().toUpperCase();
    const bookingPassword = String(req.body.bookingPassword || "").trim().toUpperCase();
    if (!bookingReference || !bookingPassword) {
      return res.status(400).json({ error: "Booking ID and password are required" });
    }

    const appointment = await populateAppointment(
      Appointment.findOne({ bookingReference }).select("+bookingPasswordHash")
    );
    if (!appointment || !appointment.bookingPasswordHash) {
      return res.status(401).json({ error: "Invalid booking ID or password" });
    }

    if (!(await bcrypt.compare(bookingPassword, appointment.bookingPasswordHash))) {
      return res.status(401).json({ error: "Invalid booking ID or password" });
    }

    let patientLoginPassword = null;
    let patientLoginId = appointment.bookingReference;
    if (!appointment.patientId) {
      let patientUser = await User.findOne({ email: appointment.patientEmail });
      if (patientUser && patientUser.role !== ROLES.PATIENT) {
        return res.status(409).json({ error: "This booking email belongs to a staff or provider account" });
      }

      if (!patientUser) {
        patientUser = new User({
          name: appointment.patientName,
          email: appointment.patientEmail,
          password: bookingPassword,
          role: ROLES.PATIENT,
          patientId: appointment.bookingReference,
          phone: appointment.patientPhone,
          gender: appointment.patientGender || "Other",
        });
        await patientUser.save();
        patientLoginPassword = bookingPassword;
      } else {
        if (!patientUser.patientId) {
          patientUser.patientId = appointment.bookingReference;
          await patientUser.save();
        }
      }

      appointment.patientId = patientUser._id;
      await appointment.save();
      patientLoginId = patientUser.patientId;
    } else {
      const patientUser = await User.findById(appointment.patientId).select("patientId");
      patientLoginId = patientUser?.patientId || appointment.bookingReference;
    }

    const guestToken = jwt.sign(
      {
        type: "guest_booking",
        id: appointment._id,
        bookingReference: appointment.bookingReference,
      },
      getJwtSecret(),
      { expiresIn: "30m" }
    );
    const queueDetails = await getQueueDetailsForAppointment(appointment);

    return res.json({
      guestToken,
      bookingReference: appointment.bookingReference,
      patientLoginId,
      patientLoginPassword,
      appointment: {
        ...sanitizeGuestAppointment(appointment),
        queueNumber: queueDetails?.queueNumber || null,
        dailyQueueSize: queueDetails?.dailyQueueSize || 0,
        patientsAhead: queueDetails?.patientsAhead ?? null,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/guest/:id", authenticateGuestBooking, async (req, res) => {
  const queueDetails = await getQueueDetailsForAppointment(req.guestAppointment);
  return res.json({
    bookingReference: req.guestAppointment.bookingReference,
    appointment: {
      ...sanitizeGuestAppointment(req.guestAppointment),
      queueNumber: queueDetails?.queueNumber || null,
      dailyQueueSize: queueDetails?.dailyQueueSize || 0,
      patientsAhead: queueDetails?.patientsAhead ?? null,
    },
  });
});

router.put("/guest/:id", authenticateGuestBooking, async (req, res) => {
  try {
    const allowedFields = ["appointmentDate", "appointmentTime", "status", "notes"];
    if (Object.keys(req.body).some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({ error: "Only rescheduling, cancellation, and notes are allowed" });
    }

    const sanitizedPayload = {};
    ["appointmentDate", "appointmentTime", "notes", "status"].forEach((field) => {
      if (req.body[field] !== undefined) sanitizedPayload[field] = String(req.body[field]).trim();
    });

    if (sanitizedPayload.status && !["Cancelled", "Rescheduled"].includes(sanitizedPayload.status)) {
      return res.status(400).json({ error: "Guests can only cancel or reschedule bookings" });
    }

    if ((sanitizedPayload.appointmentDate || sanitizedPayload.appointmentTime) && sanitizedPayload.status !== "Cancelled") {
      sanitizedPayload.status = "Rescheduled";
    }

    const validationError = validateAppointmentPayload({
      ...req.guestAppointment.toObject(),
      ...sanitizedPayload,
      status: sanitizedPayload.status || req.guestAppointment.status,
    });
    if (validationError) return res.status(400).json({ error: validationError });

    const slotError = await ensureSlotIsAvailable(
      { ...req.guestAppointment.toObject(), ...sanitizedPayload, status: sanitizedPayload.status || req.guestAppointment.status },
      req.guestAppointment._id
    );
    if (slotError) return res.status(409).json({ error: slotError });

    const updatedAppointment = await populateAppointment(
      Appointment.findByIdAndUpdate(req.guestAppointment._id, sanitizedPayload, { new: true, runValidators: true })
    );
    const queueDetails = await getQueueDetailsForAppointment(updatedAppointment);
    return res.json({
      bookingReference: updatedAppointment.bookingReference,
      appointment: {
        ...sanitizeGuestAppointment(updatedAppointment),
        queueNumber: queueDetails?.queueNumber || null,
        dailyQueueSize: queueDetails?.dailyQueueSize || 0,
        patientsAhead: queueDetails?.patientsAhead ?? null,
      },
    });
  } catch (error) {
    return sendAppointmentWriteError(res, error);
  }
});

const getStaffAccess = async (userId) => {
  const staffUser = await User.findById(userId)
    .select("clinicId doctorId isActive role")
    .lean();

  if (!staffUser || staffUser.isActive === false || staffUser.role !== ROLES.STAFF) {
    return { staffUser: null, doctorIds: [] };
  }

  if (staffUser.doctorId) {
    return {
      staffUser,
      doctorIds: [staffUser.doctorId],
    };
  }

  if (staffUser.clinicId) {
    const clinicDoctors = await Doctor.find({
      $or: [
        { clinic: staffUser.clinicId },
        { clinics: staffUser.clinicId },
      ],
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    return {
      staffUser,
      doctorIds: clinicDoctors.map((doctor) => doctor._id),
    };
  }

  return {
    staffUser,
    doctorIds: [],
  };
};

const staffCanAccessAppointment = async (userId, appointment) => {
  const { staffUser, doctorIds } = await getStaffAccess(userId);

  if (!staffUser || !doctorIds.length || !appointment?.doctorId) {
    return false;
  }

  return doctorIds.some(
    (doctorId) => String(doctorId) === String(appointment.doctorId)
  );
};

router.use(authenticateUser);

router.get("/reports/patients", async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month || ""))
      ? String(req.query.month)
      : new Date().toISOString().slice(0, 7);
    const [year, monthNumber] = month.split("-").map(Number);
    const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
    const nextMonth = nextMonthDate.toISOString().slice(0, 7);
    const filters = {
      type: "doctor",
      appointmentDate: {
        $gte: `${month}-01`,
        $lt: `${nextMonth}-01`,
      },
    };

    if (hasRole(req.user, ROLES.SUPER_ADMIN)) {
      if (req.query.doctorId) {
        if (!mongoose.isValidObjectId(req.query.doctorId)) {
          return res.status(400).json({ error: "Invalid doctor filter" });
        }
        filters.doctorId = req.query.doctorId;
      }

      if (req.query.clinicId) {
        if (!mongoose.isValidObjectId(req.query.clinicId)) {
          return res.status(400).json({ error: "Invalid clinic filter" });
        }
        filters.clinic = req.query.clinicId;
      }
    } else if (hasRole(req.user, ROLES.DOCTOR)) {
      const doctorProfile = await getDoctorProfileForUser(req.user);
      if (!doctorProfile) return res.json({ month, summary: {}, patients: [] });
      filters.doctorId = doctorProfile._id;
    } else if (hasRole(req.user, ROLES.STAFF)) {
      const { staffUser, doctorIds } = await getStaffAccess(req.user.id);
      if (!staffUser || !doctorIds.length) {
        return res.json({ month, summary: {}, patients: [] });
      }
      filters.doctorId = { $in: doctorIds };
    } else {
      return res.status(403).json({ error: "You are not allowed to view patient reports" });
    }

    const appointments = await Appointment.find(filters)
      .populate("doctorId", "name specialization")
      .populate("clinic", "name city state")
      .lean()
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const patientMap = new Map();
    const doctorIds = new Set();
    const clinicIds = new Set();
    let completedVisits = 0;

    appointments.forEach((appointment) => {
      const patientKey = String(
        appointment.patientId?._id ||
          appointment.patientId ||
          appointment.patientEmail ||
          appointment.patientPhone ||
          appointment.patientName
      ).toLowerCase();

      if (!patientMap.has(patientKey)) {
        patientMap.set(patientKey, {
          patientId: appointment.patientId?._id || appointment.patientId || null,
          name: appointment.patientName || "Unknown Patient",
          email: appointment.patientEmail || "",
          phone: appointment.patientPhone || "",
          age: appointment.patientAge || "",
          gender: appointment.patientGender || "",
          visits: 0,
          completedVisits: 0,
          lastVisit: appointment.appointmentDate || "",
          lastStatus: appointment.status || "",
          lastReason: appointment.reason || "",
          doctors: new Map(),
          clinics: new Map(),
        });
      }

      const patient = patientMap.get(patientKey);
      patient.visits += 1;
      if (appointment.status === "Completed") {
        patient.completedVisits += 1;
        completedVisits += 1;
      }

      if ((appointment.appointmentDate || "") >= patient.lastVisit) {
        patient.lastVisit = appointment.appointmentDate || patient.lastVisit;
        patient.lastStatus = appointment.status || patient.lastStatus;
        patient.lastReason = appointment.reason || patient.lastReason;
        patient.age = appointment.patientAge || patient.age;
        patient.gender = appointment.patientGender || patient.gender;
      }

      if (appointment.doctorId?._id) {
        doctorIds.add(String(appointment.doctorId._id));
        patient.doctors.set(String(appointment.doctorId._id), appointment.doctorId.name);
      }
      if (appointment.clinic?._id) {
        clinicIds.add(String(appointment.clinic._id));
        patient.clinics.set(String(appointment.clinic._id), appointment.clinic.name);
      }
    });

    const patients = Array.from(patientMap.values())
      .map((patient) => ({
        ...patient,
        doctors: Array.from(patient.doctors.values()),
        clinics: Array.from(patient.clinics.values()),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return res.json({
      month,
      summary: {
        totalVisits: appointments.length,
        uniquePatients: patients.length,
        completedVisits,
        doctorCount: doctorIds.size,
        clinicCount: clinicIds.size,
      },
      patients,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

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
    } else if (hasRole(_req.user, ROLES.STAFF)) {
      const { staffUser, doctorIds } = await getStaffAccess(_req.user.id);

      if (!staffUser) {
        return res.json([]);
      }

      if (!doctorIds.length) {
        return res.json([]);
      }

      filters.doctorId = { $in: doctorIds };
    } else {
      filters.$or = [
        { patientId: _req.user.id },
        { patientEmail: _req.user.email },
      ];
    }

    const appointments = await Appointment.find(filters)
      .populate("doctorId", "name specialization location fees userId email")
      .populate("labId", "name location email")
      .populate("clinic", "name city state address phone")
      .populate("hospital", "name city state address phone")
      .populate("department", "name")
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
    await appointment.populate("clinic", "name city state address phone");
    await appointment.populate("hospital", "name city state address phone");
    await appointment.populate("department", "name");
    await appointment.populate("referredBy", "name");
    await appointment.populate("patientId", "name email role");

    const queueFilter = {
      type: appointment.type,
      appointmentDate: appointment.appointmentDate,
      status: { $in: ACTIVE_SLOT_STATUSES },
    };

    if (appointment.type === "lab") {
      queueFilter.labId = appointment.labId;
    } else {
      queueFilter.doctorId = appointment.doctorId;
    }

    const queueAppointments = await Appointment.find(queueFilter)
      .select("_id type doctorId labId appointmentDate appointmentTime createdAt status")
      .lean();
    const queueAppointment = attachQueueDetails(queueAppointments).find(
      (item) => String(item._id) === String(appointment._id)
    );
    const appointmentWithQueue = {
      ...appointment.toObject(),
      queueNumber: queueAppointment?.queueNumber || null,
      dailyQueueSize: queueAppointment?.dailyQueueSize || 0,
      patientsAhead: queueAppointment?.patientsAhead ?? null,
    };

    res.status(201).json(appointmentWithQueue);
  } catch (error) {
    sendAppointmentWriteError(res, error);
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
    } else if (hasRole(req.user, ROLES.STAFF)) {
      const hasAccess = await staffCanAccessAppointment(
        req.user.id,
        appointment
      );

      if (!hasAccess) {
        return res.status(403).json({
          error:
            "You can only manage appointments assigned to your doctor or clinic",
        });
      }

      const requestedFields = Object.keys(req.body).filter((field) =>
        EDITABLE_FIELDS.includes(field)
      );
      const staffEditableFields = [
        "patientName",
        "patientEmail",
        "patientPhone",
        "patientAge",
        "patientGender",
        "patientWeight",
        "patientAddress",
        "bloodPressure",
        "appointmentDate",
        "appointmentTime",
        "status",
        "reason",
        "disease",
        "treatmentPlan",
        "notes",
      ];
      const hasOnlyStaffFields = requestedFields.every((field) =>
        staffEditableFields.includes(field)
      );

      if (!hasOnlyStaffFields) {
        return res.status(403).json({
          error:
            "Staff can only manage appointment details, status, and notes",
        });
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
        field === "patientWeight" ||
        field === "patientAddress" ||
        field === "bloodPressure" ||
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
      .populate("clinic", "name city state address phone")
      .populate("hospital", "name city state address phone")
      .populate("department", "name")
      .populate("referredBy", "name")
      .populate("patientId", "name email role");

    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(updatedAppointment);
  } catch (error) {
    sendAppointmentWriteError(res, error);
  }
});

module.exports = router;
