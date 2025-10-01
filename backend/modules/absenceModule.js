// models/Absence.js
const mongoose = require("mongoose");

const absenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Identifiant utilisateur requis."],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "La date de début est requise."],
    },
    endDate: {
      type: Date,
      required: [true, "La date de fin est requise."],
      validate: {
        validator: function (end) {
          if (!this.startDate) return true;
          return this.startDate <= end;
        },
        message:
          "La date de fin doit être postérieure ou égale à la date de début.",
      },
    },
    type: {
      type: String,
      enum: [
        "maladie",
        "conge_annuel",
        "conge_sans_solde",
        "maternite",
        "absence_sans_justification",
        "deuil",
      ],
      required: [true, "Le type d'absence est requis."],
    },
    proofUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(v);
        },
        message:
          "proofUrl doit être une URL valide (commençant par http:// ou https://).",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
      index: true,
    },
    removed: { type: Boolean, default: false, index: true },
    commentaire_RH: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// Indexes utiles
absenceSchema.index({ status: 1, createdAt: -1 });
absenceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Absence", absenceSchema);
