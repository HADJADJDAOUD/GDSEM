const mongoose = require("mongoose");

const transportDeclarationSchema = new mongoose.Schema(
  {
    // 🔗 Reference to User (parent)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🧾 Form fields
    nomPrenom: { type: String, required: true },
    lieuNaissance: { type: String },
    adresseDomicile: { type: String },
    qualite: { type: String }, // e.g., "Agent", "Cadre", etc.
    lieuTravail: { type: String }, // Direction / Centre rattaché
    distanceKm: { type: String },
status: { type: String, enum: ["pending", "accepted", "refused"], default: "pending" },
    // ✍️ Signature
    signatureInterested: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TransportDeclaration",
  transportDeclarationSchema
);
