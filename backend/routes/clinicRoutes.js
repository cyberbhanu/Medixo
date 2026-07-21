const router = require("express").Router();
const Clinic = require("../models/Clinic");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { ROLES } = require("../utils/roles");

router.get("/", async (_req, res) => {
  try {
    const clinics = await Clinic.find({ isActive: { $ne: false } })
      .populate("doctors", "name specialization location")
      .populate("departments", "name")
      .sort({ createdAt: -1 });

    res.json(clinics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ _id: req.params.id, isActive: { $ne: false } })
      .populate("doctors", "name specialization qualification experience fees profileImage rating reviewCount availability consultationType nextAvailableSlot")
      .populate("departments", "name description");

    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    res.json(clinic);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid clinic ID format" });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const clinic = await Clinic.create(req.body);
    console.info("admin_action", {
      action: "create_clinic",
      actorId: req.user.id,
      clinicId: String(clinic._id),
    });
    res.status(201).json(clinic);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    console.info("admin_action", {
      action: "update_clinic",
      actorId: req.user.id,
      clinicId: req.params.id,
    });

    res.json(clinic);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndDelete(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    console.info("admin_action", {
      action: "delete_clinic",
      actorId: req.user.id,
      clinicId: req.params.id,
    });

    res.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
