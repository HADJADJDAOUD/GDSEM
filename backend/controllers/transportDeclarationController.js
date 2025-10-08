const TransportDeclaration = require("../modules/TransportDeclaration");

// ✅ Create a new transport declaration (owned by logged-in user)
const createTransportDeclaration = async (req, res) => {
  try {
    const declaration = await TransportDeclaration.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Transport declaration created successfully",
      declaration,
    });
  } catch (error) {
    console.error("❌ Error creating transport declaration:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Get all transport declarations of the logged-in user
const getMyTransportDeclarations = async (req, res) => {
  try {
    const declarations = await TransportDeclaration.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, declarations });
  } catch (error) {
    console.error("❌ Error fetching transport declarations:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { createTransportDeclaration, getMyTransportDeclarations };
