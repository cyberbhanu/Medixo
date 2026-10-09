const router = require("express").Router();
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { ROLES } = require("../utils/roles");

const doctorFields = "name specialization location qualification experience fees profileImage rating reviewCount availability consultationType nextAvailableSlot";

const attachAssignedDoctors = async (hospital) => {
  const linkedDoctors = await Doctor.find({
    isActive: { $ne: false },
    $or: [{ hospital: hospital._id }, { hospitals: hospital._id }],
  }).select(doctorFields).lean();
  const existingDoctors = (hospital.doctors || []).map((doctor) =>
    typeof doctor.toObject === "function" ? doctor.toObject() : doctor
  );
  const doctorsById = new Map();
  [...existingDoctors, ...linkedDoctors].forEach((doctor) => {
    if (doctor?._id) doctorsById.set(String(doctor._id), doctor);
  });
  hospital.doctors = Array.from(doctorsById.values());
  return hospital;
};

router.get("/", async (_req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: { $ne: false } })
      .populate("doctors", "name specialization location")
      .populate("departments", "name")
      .populate("laboratories", "name location")
      .sort({ createdAt: -1 });

    res.json(await Promise.all(hospitals.map(attachAssignedDoctors)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/account/me", authenticateUser, authorizeRoles(ROLES.HOSPITAL), async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id, isActive: { $ne: false } })
      .populate("doctors", "name specialization location experience fees profileImage rating reviewCount")
      .populate("appointments", "patientName appointmentDate appointmentTime status queueNumber doctorId");

    if (!hospital) return res.status(404).json({ error: "Hospital profile not found" });
    res.json(await attachAssignedDoctors(hospital));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ _id: req.params.id, isActive: { $ne: false } })
      .populate("doctors", "name specialization qualification experience fees profileImage rating reviewCount availability consultationType nextAvailableSlot")
      .populate("departments", "name description")
      .populate("laboratories", "name location address rating homeSampleCollection availableTests");

    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json(hospital);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid hospital ID format" });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  let createdUser = null;
  try {
    const { password, email, ...hospitalData } = req.body;
    if (email && password) {
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) return res.status(409).json({ error: "That hospital login email is already in use" });
      createdUser = await User.create({
        name: hospitalData.name,
        email: email.trim().toLowerCase(),
        password,
        role: ROLES.HOSPITAL,
      });
      hospitalData.userId = createdUser._id;
    }
    const hospital = await Hospital.create({ ...hospitalData, email: email?.trim().toLowerCase() || hospitalData.email || "" });
    if (createdUser) {
      createdUser.hospitalId = hospital._id;
      await createdUser.save();
    }
    console.info("admin_action", {
      action: "create_hospital",
      actorId: req.user.id,
      hospitalId: String(hospital._id),
    });
    res.status(201).json(hospital);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { password, email, ...hospitalData } = req.body;
    const existing = await Hospital.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Hospital not found" });
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, {
      ...hospitalData,
      ...(email ? { email: email.trim().toLowerCase() } : {}),
    }, {
      new: true,
      runValidators: true,
    });

    if (password && existing.userId) {
      const account = await User.findById(existing.userId).select("+password");
      if (account) {
        account.password = password;
        if (email) account.email = email.trim().toLowerCase();
        await account.save();
      }
    }

    console.info("admin_action", {
      action: "update_hospital",
      actorId: req.user.id,
      hospitalId: req.params.id,
    });

    res.json(hospital);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    console.info("admin_action", {
      action: "delete_hospital",
      actorId: req.user.id,
      hospitalId: req.params.id,
    });

    res.json({ message: "Hospital deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
