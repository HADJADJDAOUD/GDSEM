// controllers/adminFormsController.js
const FormHeuresSup = require("../modules/FormHeuresSup");
const Declaration = require("../modules/Declaration");
const TransportDeclaration = require("../modules/TransportDeclaration");
const DemandePrestation = require("../modules/DemandePrestation");

// Get all pending FormHeuresSup
const getAllFormHeuresSup = async (req, res) => {
  try {
    const forms = await FormHeuresSup.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    return res.json({ success: true, data: forms });
  } catch (err) {
    console.error("getAllFormHeuresSup:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all pending Declarations
const getAllDeclarations = async (req, res) => {
  try {
    const items = await Declaration.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getAllDeclarations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all pending Transport Declarations
const getAllTransportDeclarations = async (req, res) => {
  try {
    const items = await TransportDeclaration.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getAllTransportDeclarations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all pending Demandes Prestations
const getAllDemandesPrestations = async (req, res) => {
  try {
    const items = await DemandePrestation.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("getAllDemandesPrestations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const MODEL_MAP = {
  demandesPrestations: DemandePrestation,
  formHeuresSup: FormHeuresSup,
  declarations: Declaration,
  transport: TransportDeclaration,
};

const validStatuses = ["pending", "accepted", "refused"];

// helper to resolve model
function resolveModel(type) {
  return MODEL_MAP[type];
}

// PATCH /api/user/admin-update/:type/:id
// body: { status: "accepted" | "refused" | "pending" }
const updateStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const Model = resolveModel(type);
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid form type." });
    }

    const updated = await Model.findByIdAndUpdate(id, { status }, { new: true }).populate("user", "name email");
    if (!updated) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateStatus:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/admin-acceptAll/:type
// Accepts all pending items for the chosen type
const acceptAllPending = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = resolveModel(type);
    if (!Model) return res.status(400).json({ success: false, message: "Invalid form type." });

    const result = await Model.updateMany({ status: "pending" }, { $set: { status: "accepted" } });
    return res.json({ success: true, modifiedCount: result.modifiedCount || result.nModified || 0 });
  } catch (err) {
    console.error("acceptAllPending:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  updateStatus,
  acceptAllPending,
    getAllFormHeuresSup,
  getAllDeclarations,
  getAllTransportDeclarations,
  getAllDemandesPrestations,
};