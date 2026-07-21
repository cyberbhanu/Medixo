const router = require("express").Router();
const Department = require("../models/Department");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { ROLES } = require("../utils/roles");

router.get("/", async (_req, res) => {
  try {
    const departments = await Department.find({ isActive: { $ne: false } })
      .populate("hospital", "name")
      .populate("clinic", "name")
      .sort({ name: 1 });

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const department = await Department.create(req.body);
    console.info("admin_action", {
      action: "create_department",
      actorId: req.user.id,
      departmentId: String(department._id),
    });
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    console.info("admin_action", {
      action: "update_department",
      actorId: req.user.id,
      departmentId: req.params.id,
    });

    res.json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    console.info("admin_action", {
      action: "delete_department",
      actorId: req.user.id,
      departmentId: req.params.id,
    });

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
