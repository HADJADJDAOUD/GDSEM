// models/RejectedAbsence.js
const mongoose = require("mongoose");

const rejectedAbsenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ["maladie", "conge", "absence"],
      required: true,
    },
    proofUrl: { type: String, default: null },
    justification: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

rejectedAbsenceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("RejectedAbsence", rejectedAbsenceSchema);
