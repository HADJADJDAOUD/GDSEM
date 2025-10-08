const mongoose = require("mongoose");

const declarationSchema = new mongoose.Schema(
  {
    // Reference to User (the parent)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Form fields
    accidentTravail: { type: String, enum: ["oui", "non"], required: true },
    accidentCirculation: { type: String, enum: ["oui", "non"], required: true },
    nomPrenom: { type: String, required: true },
    dateNaissance: { type: String },
    lieuNaissance: { type: String },
    numeroImmatriculation: { type: String },
    employeur: { type: String },
    dateDebutArret: { type: String },
    dateFinArret: { type: String },
    lieuResidence: { type: String },
    faitA: { type: String },
    faitLe: { type: String },

    // Signature (base64 image)
    signatureAgent: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Declaration", declarationSchema);
