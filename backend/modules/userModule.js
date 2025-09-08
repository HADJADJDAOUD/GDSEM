// models/User.js
const mongoose = require("mongoose");

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
    // removed embedded absences here — we will use a virtual to populate Absence docs
    endDate: {
      type: Date,
      default: function () {
        return this.createdAt;
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Virtual for reverse populate: user.absences
userSchema.virtual("absences", {
  ref: "Absence", // model to use
  localField: "_id", // find Absence where `user` === `_id`
  foreignField: "user",
  justOne: false,
  options: { sort: { createdAt: -1 } }, // latest first
});

// add any indexes you want on user fields
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model("User", userSchema);
