const mongoose = require("mongoose");

const absenceSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (end) {
          // 'this' is the subdocument
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
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // do not return by default
    },
    role: {
      type: String,
      enum: ["user", "RH", "DRH"],
      default: "user",
    },
    absences: {
      type: [absenceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// explicit indexes for uniqueness (unique in schema creates an index but being explicit is safer)

module.exports = mongoose.model("User", userSchema);
