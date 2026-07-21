const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    openingHours: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyAvailable: {
      type: Boolean,
      default: false,
    },
    mapUrl: {
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
    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    laboratories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lab",
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

HospitalSchema.index({ name: 1 });
HospitalSchema.index({ city: 1 });
HospitalSchema.index({ isActive: 1 });

module.exports = mongoose.model("Hospital", HospitalSchema);
