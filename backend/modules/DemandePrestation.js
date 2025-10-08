const mongoose = require("mongoose");

const demandePrestationSchema = new mongoose.Schema(
  {
    // 🔗 Reference to user (the parent)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🧾 Form fields
    prestations: [{ type: String }], // list of prestations (checked boxes)
    numeroAdhesion: { type: String },
    nomPrenoms: { type: String, required: true },
    dateNaissance: { type: String },
    wilayaNaissance: { type: String },
    organismeEmployeur: { type: String },
    wilayaEmployeur: { type: String },
    numeroCompteCCP: { type: String },
    adresseDomicile: { type: String },

    beneficiaireType: [{ type: String }], // checkboxes
    beneficiaireNomPrenoms: { type: String },
    beneficiaireDateNaissance: { type: String },
    beneficiaireWilaya: { type: String },
    naturePrestation: { type: String },
status: { type: String, enum: ["pending", "accepted", "refused"], default: "pending" },
    // ✍️ Signature
    signature: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemandePrestation", demandePrestationSchema);
