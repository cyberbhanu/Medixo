const router = require("express").Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Lab = require("../models/Lab");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { isGlobalAdmin, cityMatches } = require("../utils/adminScope");
const { ROLES, hasRole } = require("../utils/roles");
const { notifyAppointmentUpdated } = require("../utils/pushNotifications");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", async (req, res) => {
  try {
    const labs = await Lab.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const getLabProfileForUser = async (user) =>
  Lab.findOne({
    $or: [{ userId: user.id }, { email: user.email }],
  });

router.get("/tests", authenticateUser, authorizeRoles(ROLES.LABORATORY), async (req, res) => {
  try {
    const labProfile = await getLabProfileForUser(req.user);
    if (!labProfile) {
      return res.json([]);
    }

    const tests = await Appointment.find({ type: "lab", labId: labProfile._id })
      .populate("labId", "name location email")
      .populate("referredBy", "name specialization")
      .populate("referredByStaff", "name staffRole")
      .populate("patientId", "name email role")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tests/:id/report", authenticateUser, authorizeRoles(ROLES.LABORATORY), reportUpload.single("report"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Please select a report file" });

    const labProfile = await getLabProfileForUser(req.user);
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      type: "lab",
      labId: labProfile?._id,
    });

    if (!appointment) return res.status(404).json({ error: "Laboratory booking not found" });

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "medixo_reports",
      resource_type: "auto",
      public_id: `report-${appointment._id}-${Date.now()}`,
    });

    const previousAppointment = appointment.toObject();
    appointment.reportUrl = uploadResult.secure_url;
    if (appointment.status !== "Rejected" && appointment.status !== "Cancelled") {
      appointment.status = "Completed";
    }
    await appointment.save();

    await Lab.findByIdAndUpdate(labProfile._id, {
      $push: { reports: { appointmentId: appointment._id, reportUrl: uploadResult.secure_url } },
    });

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate("doctorId", "name specialization location fees userId email")
      .populate("labId", "name location email")
      .populate("referredBy", "name")
      .populate("referredByStaff", "name staffRole")
      .populate("patientId", "name email role");

    notifyAppointmentUpdated(previousAppointment, updatedAppointment.toObject())
      .catch((error) => console.error("Report notification failed:", error.message));

    return res.json(updatedAppointment);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to upload report" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const lab = await Lab.findOne({ _id: req.params.id, isActive: { $ne: false } })
      .populate("hospitals", "name city address");

    if (!lab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    res.json(lab);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid laboratory ID format" });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN), async (req, res) => {
  try {
    if (!isGlobalAdmin(req.user) && !cityMatches(req.user, req.body.location)) {
      return res.status(403).json({ error: "Laboratory location is outside your assigned district" });
    }
    const { name, email, password, location, logo, availableTests = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: ROLES.LABORATORY,
    });
    await user.save();

    const lab = await Lab.create({
      userId: user._id,
      email: normalizedEmail,
      name: name.trim(),
      location: location?.trim() || "",
      logo: logo?.trim() || "",
      address: req.body.address?.trim() || "",
      phone: req.body.phone?.trim() || "",
      mapUrl: req.body.mapUrl?.trim() || "",
      availableTests,
    });

    console.info("admin_action", {
      action: "create_laboratory",
      actorId: req.user.id,
      labId: String(lab._id),
    });

    res.status(201).json(lab);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN, ROLES.LABORATORY), async (req, res) => {
  try {
    if (req.user?.role === ROLES.DISTRICT_ADMIN) {
      const existingLab = await Lab.findById(req.params.id).select("location").lean();
      if (!existingLab || !cityMatches(req.user, existingLab.location) || !cityMatches(req.user, req.body.location)) {
        return res.status(403).json({ error: "Laboratory is outside your assigned district" });
      }
    }
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    if (hasRole(req.user, ROLES.LABORATORY)) {
      const isOwnLab = String(lab.userId || "") === req.user.id || lab.email === req.user.email;
      if (!isOwnLab) {
        return res.status(403).json({ error: "You can only update your own laboratory profile" });
      }
    }

    const updatePayload = {};
    ["name", "email", "location", "address", "phone", "mapUrl", "logo"].forEach((field) => {
      if (req.body[field] !== undefined) {
        updatePayload[field] = String(req.body[field]).trim();
      }
    });
    if (updatePayload.email) {
      updatePayload.email = updatePayload.email.toLowerCase();
    }
    if (req.body.availableTests !== undefined) {
      updatePayload.availableTests = req.body.availableTests;
    }
    if (req.body.isActive !== undefined && hasRole(req.user, ROLES.SUPER_ADMIN)) {
      updatePayload.isActive = Boolean(req.body.isActive);
    }

    const updatedLab = await Lab.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (hasRole(req.user, ROLES.SUPER_ADMIN) && (req.body.password || updatePayload.email || updatePayload.name)) {
      const labUser = lab.userId ? await User.findById(lab.userId) : null;
      if (labUser) {
        if (req.body.password) labUser.password = req.body.password;
        if (updatePayload.email) labUser.email = updatePayload.email;
        if (updatePayload.name) labUser.name = updatePayload.name;
        await labUser.save();
      }
    }

    if (hasRole(req.user, ROLES.SUPER_ADMIN)) {
      console.info("admin_action", {
        action: "update_laboratory",
        actorId: req.user.id,
        labId: req.params.id,
      });
    }

    res.json(updatedLab);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN), async (req, res) => {
  try {
    if (!isGlobalAdmin(req.user)) {
      const existingLab = await Lab.findById(req.params.id).select("location").lean();
      if (!existingLab || !cityMatches(req.user, existingLab.location)) {
        return res.status(403).json({ error: "Laboratory is outside your assigned district" });
      }
    }
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    if (lab.userId) {
      await User.findByIdAndDelete(lab.userId);
    }

    await Lab.findByIdAndDelete(req.params.id);
    console.info("admin_action", {
      action: "delete_laboratory",
      actorId: req.user.id,
      labId: req.params.id,
    });
    res.json({ message: "Laboratory and login deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
