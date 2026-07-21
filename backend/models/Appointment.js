const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: function() { return this.type !== 'lab'; },
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: function() { return this.type === 'lab'; },
    },
    type: {
      type: String,
      enum: ["doctor", "lab"],
      default: "doctor",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    patientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    patientAge: {
      type: Number,
      required: true,
      min: 0,
    },
    patientGender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    appointmentDate: {
      type: String,
      required: true,
      trim: true,
    },
    appointmentTime: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Approved", "Rejected", "Completed", "Cancelled", "Rescheduled"],
      default: "Scheduled",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    disease: {
      type: String,
      trim: true,
      default: "",
    },
    treatmentPlan: {
      type: String,
      trim: true,
      default: "",
    },
    prescription: {
      type: String,
      trim: true,
      default: "",
    },
    prescriptionUrl: {
      type: String,
      trim: true,
      default: "",
    },
    labReferral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    testName: {
      type: String,
      trim: true,
      default: "",
    },
    reportUrl: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ doctorId: 1, createdAt: -1 });
AppointmentSchema.index({ labId: 1, createdAt: -1 });
AppointmentSchema.index({ patientId: 1, createdAt: -1 });
AppointmentSchema.index({ patientEmail: 1, createdAt: -1 });
AppointmentSchema.index({ appointmentDate: 1, appointmentTime: 1, createdAt: 1 });
AppointmentSchema.index({ hospital: 1, appointmentDate: 1 });
AppointmentSchema.index({ clinic: 1, appointmentDate: 1 });

module.exports = mongoose.model("Appointment", AppointmentSchema);
