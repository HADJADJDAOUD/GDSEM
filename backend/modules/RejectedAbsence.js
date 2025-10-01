// models/RejectedAbsence.js
const mongoose = require("mongoose");

/**
 * Schéma RejectedAbsence — demandes rejetées (archivage temporaire)
 * Types identiques à ceux d'Absence pour consistance.
 */

const rejectedAbsenceSchema = new mongoose.Schema(
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
    endDate: { type: Date, required: [true, "La date de fin est requise."] },
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
    proofUrl: { type: String, default: null },
    // justification fournie par le demandeur (obligatoire ici)
    justification: {
      type: String,
      required: [
        true,
        "La justification est requise pour les absences rejetées.",
      ],
      trim: true,
    },
    status: { type: String, enum: ["declined"], default: "declined" },
    removed: { type: Boolean, default: false, index: true },
    commentaire_RH: { type: String, trim: true, default: null },
    // motif du rejet côté RH (utile pour audits)
    motif_rejet_RH: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

rejectedAbsenceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("RejectedAbsence", rejectedAbsenceSchema);
