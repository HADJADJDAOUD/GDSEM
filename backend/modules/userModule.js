// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Le nom d'utilisateur est requis."],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'adresse e-mail est requise."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Veuillez fournir une adresse e-mail valide."],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis."],
      minlength: [8, "Le mot de passe doit contenir au moins 8 caractères."],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "RH", "DRH"],
      default: "user",
    },
    service: { type: String, trim: true, default: null },
    endDate: {
      type: Date,
      default: function () {
        return this.createdAt;
      },
    },
    // 👇 NEW: Per-user leave balances (index 0 = paid, index 1 = unpaid)
    conge_balance: {
      type: [Number],
      default: [30, 30], // [conge_annuel, conge_sans_solde]
      validate: {
        validator: function (v) {
          return (
            v.length === 2 && v[0] >= 0 && v[0] <= 30 && v[1] >= 0 && v[1] <= 30
          );
        },
        message: "conge_balance must be [paid, unpaid] with values 0-30",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Virtual pour reverse populate: user.absences
userSchema.virtual("absences", {
  ref: "Absence",
  localField: "_id",
  foreignField: "user",
  justOne: false,
  options: { sort: { createdAt: -1 } },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
