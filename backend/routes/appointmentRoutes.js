const router = require("express").Router();
const Appointment = require("../models/Appointment");

router.post("/", async (req, res) => {
  const appointment = new Appointment(req.body);
  await appointment.save();
  res.json(appointment);
});

module.exports = router;