const mongoose = require("mongoose");

const PushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true, trim: true },
    keys: {
      p256dh: { type: String, required: true, trim: true },
      auth: { type: String, required: true, trim: true },
    },
    userAgent: { type: String, default: "", trim: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
