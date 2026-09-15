const mongoose = require("mongoose");

const AccountDeletionRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    reason: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AccountDeletionRequestSchema.index({ email: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("AccountDeletionRequest", AccountDeletionRequestSchema);
