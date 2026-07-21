const mongoose = require("mongoose");

const LabSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.7,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    homeSampleCollection: {
      type: Boolean,
      default: false,
    },
    hospitals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
      },
    ],
    availableTests: [
      {
        name: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          min: 0,
          default: 0,
        },
        turnaroundTime: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    reports: [
      {
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        reportUrl: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

LabSchema.index({ userId: 1 });
LabSchema.index({ email: 1 });
LabSchema.index({ location: 1 });

module.exports = mongoose.model("Lab", LabSchema);
