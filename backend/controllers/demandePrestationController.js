const DemandePrestation = require("../modules/DemandePrestation");

// ✅ Create a new Demande de Prestations
const createDemandePrestation = async (req, res) => {
  try {
    const demande = await DemandePrestation.create({
      ...req.body,
      user: req.user._id, // taken from protect middleware
    });

    res.status(201).json({
      success: true,
      message: "Demande de prestations created successfully",
      demande,
    });
  } catch (error) {
    console.error("❌ Error creating demande de prestations:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Get all demandes for the logged-in user
const getMyDemandesPrestations = async (req, res) => {
  try {
    const demandes = await DemandePrestation.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, demandes });
  } catch (error) {
    console.error("❌ Error fetching demandes:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { createDemandePrestation, getMyDemandesPrestations };
