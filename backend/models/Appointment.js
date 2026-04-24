const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  doctorId: String,
  patientName: String,
  date: String,
});

module.exports = mongoose.model("Appointment", AppointmentSchema);