// models/Absence.js
const mongoose = require("mongoose");

const absenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (end) {
          // 'this' is the document
          return !this.startDate || this.startDate <= end;
        },
        message: "endDate must be greater than or equal to startDate",
      },
    },
    type: {
      type: String,
      enum: ["maladie", "conge", "absence"],
      required: true,
    },
    proofUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional
          // simple URL sanity check
          return /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(v);
        },
        message: "proofUrl must be a valid URL",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
      index: true,
    },
    removed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// helpful indexes
absenceSchema.index({ status: 1, createdAt: -1 });
absenceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Absence", absenceSchema);
