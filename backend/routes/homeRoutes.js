const router = require("express").Router();
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Clinic = require("../models/Clinic");
const Lab = require("../models/Lab");
const Department = require("../models/Department");

router.get("/", async (_req, res) => {
  try {
    const [doctors, hospitals, clinics, labs, departments] = await Promise.all([
      Doctor.find({ isActive: { $ne: false } })
        .populate("hospital", "name city address")
        .populate("hospitals", "name city address")
        .populate("clinic", "name city address")
        .populate("clinics", "name city address")
        .populate("department", "name")
        .sort({ createdAt: -1 }),
      Hospital.find({ isActive: { $ne: false } })
        .populate("doctors", "name specialization location")
        .populate("departments", "name")
        .populate("laboratories", "name location")
        .sort({ createdAt: -1 }),
      Clinic.find({ isActive: { $ne: false } })
        .populate("doctors", "name specialization location")
        .populate("departments", "name")
        .sort({ createdAt: -1 }),
      Lab.find({ isActive: { $ne: false } })
        .populate("hospitals", "name city address")
        .sort({ createdAt: -1 }),
      Department.find({ isActive: { $ne: false } })
        .populate("hospital", "name")
        .populate("clinic", "name")
        .sort({ name: 1 }),
    ]);

    res.json({ doctors, hospitals, clinics, labs, departments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
