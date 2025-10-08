const mongoose = require("mongoose");

const formHeuresSupSchema = new mongoose.Schema(
  {
    // 🔗 Reference to User (the "parent")
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🧾 Form fields
    nom: String,
    prenom: String,
    service: String,
    interventionType: {
      distance: { type: Boolean, default: false },
      presentiel: { type: Boolean, default: false },
    },
    lieuIntervention: String,
    datesIntervention: String,
    horaires: String,
    totalHeuresSupplementaires: String,
    objetsIntervention: String,

    // 🖋️ Signatures and names
    nomDemandeur: String,
    signatureDateDemandeur: String,
    status: { type: String, enum: ["pending", "accepted", "refused"], default: "pending" },
    signatureDemandeur: String, // base64 image URL

    nomSuperieur: String,
    signatureDateSuperieur: String,
    signatureSuperieur: String, // base64 image URL
    
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("formheures", formHeuresSupSchema);
