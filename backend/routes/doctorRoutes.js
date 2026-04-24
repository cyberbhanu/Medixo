const router = require("express").Router();
const Doctor = require("../models/Doctor");

router.get("/", async (req, res) => {
  const doctors = await Doctor.find();
  res.json(doctors);
});

router.post("/", async (req, res) => {
  const doctor = new Doctor(req.body);
  await doctor.save();
  res.json(doctor);
});

module.exports = router;