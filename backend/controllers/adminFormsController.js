// controllers/adminFormsController.js
const FormHeuresSup = require("../modules/FormHeuresSup");
const Declaration = require("../modules/Declaration");
const TransportDeclaration = require("../modules/TransportDeclaration");
const DemandePrestation = require("../modules/DemandePrestation");

const getAllFormHeuresSup = async (req, res) => {
  try {
    const forms = await FormHeuresSup.find().sort({ createdAt: -1 }).populate("user", "name email");
    return res.json({ success: true, data: forms });
  } catch (err) {
    console.error("getAllFormHeuresSup:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllDeclarations = async (req, res) => {
  try {
    const items = await Declaration.find().sort({ createdAt: -1 }).populate("user", "name email");
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getAllDeclarations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllTransportDeclarations = async (req, res) => {
  try {
    const items = await TransportDeclaration.find().sort({ createdAt: -1 }).populate("user", "name email");
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getAllTransportDeclarations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllDemandesPrestations = async (req, res) => {
  try {
    const items = await DemandePrestation.find().sort({ createdAt: -1 }).populate("user", "name email");
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getAllDemandesPrestations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllFormHeuresSup,
  getAllDeclarations,
  getAllTransportDeclarations,
  getAllDemandesPrestations,
};
