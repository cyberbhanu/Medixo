const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
      default: "",
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },
    hospitals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
      },
    ],
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    clinics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
      },
    ],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    fees: {
      type: Number,
      required: true,
      min: 0,
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.8,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    consultationType: {
      type: String,
      enum: ["Online", "Offline", "Online/Offline"],
      default: "Offline",
    },
    nextAvailableSlot: {
      type: String,
      trim: true,
      default: "",
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    treatmentsOffered: [
      {
        type: String,
        trim: true,
      },
    ],
    diseasesTreated: [
      {
        type: String,
        trim: true,
      },
    ],
    reviews: [
      {
        patientName: {
          type: String,
          trim: true,
        },
        rating: {
          type: Number,
          min: 0,
          max: 5,
          default: 5,
        },
        comment: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    hospitalClinicDetails: {
      hospitalName: {
        type: String,
        trim: true,
        default: "",
      },
      clinicName: {
        type: String,
        trim: true,
        default: "",
      },
      clinicImage: {
        type: String,
        trim: true,
        default: "",
      },
      clinicAddress: {
        type: String,
        trim: true,
        default: "",
      },
      phoneNumber: {
        type: String,
        trim: true,
        default: "",
      },
      licenseNumber: {
        type: String,
        trim: true,
        default: "",
      },
      registrationNumber: {
        type: String,
        trim: true,
        default: "",
      },
      timings: {
        type: String,
        trim: true,
        default: "",
      },
      services: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    detailsSubmitted: {
      type: Boolean,
      default: false,
    },
    availability: [
      {
        day: String,
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
    ],
    slots: [
      {
        date: String,
        startTime: String,
        endTime: String,
        isBooked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    labReferrals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    appointmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    patientIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

DoctorSchema.index({ email: 1 });
DoctorSchema.index({ specialization: 1, location: 1 });
DoctorSchema.index({ experience: 1 });
DoctorSchema.index({ fees: 1 });
DoctorSchema.index({ createdAt: -1 });
DoctorSchema.index({ hospital: 1 });
DoctorSchema.index({ clinic: 1 });
DoctorSchema.index({ department: 1 });
DoctorSchema.index({ isActive: 1 });

module.exports = mongoose.model("Doctor", DoctorSchema);
