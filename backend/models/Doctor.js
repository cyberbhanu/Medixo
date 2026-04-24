const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  experience: Number,
  location: String,
  fees: Number,
});

module.exports = mongoose.model("Doctor", DoctorSchema);