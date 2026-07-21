const router = require("express").Router();
const Hospital = require("../models/Hospital");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { ROLES } = require("../utils/roles");

router.get("/", async (_req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: { $ne: false } })
      .populate("doctors", "name specialization location")
      .populate("departments", "name")
      .populate("laboratories", "name location")
      .sort({ createdAt: -1 });

    res.json(hospitals);
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
  try {
    const hospital = await Hospital.create(req.body);
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
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
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
