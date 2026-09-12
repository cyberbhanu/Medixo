const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, default: "appointment", trim: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
