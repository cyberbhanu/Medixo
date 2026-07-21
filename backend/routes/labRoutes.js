const router = require("express").Router();
const Lab = require("../models/Lab");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { ROLES, hasRole } = require("../utils/roles");

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
      .populate("patientId", "name email role")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

router.post("/", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { name, email, password, location, availableTests = [] } = req.body;

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

router.put("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LABORATORY), async (req, res) => {
  try {
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
    ["name", "email", "location"].forEach((field) => {
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

router.delete("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
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
