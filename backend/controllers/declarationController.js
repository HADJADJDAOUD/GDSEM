const Declaration = require ("../modules/Declaration.js");

// ✅ Create a new declaration (user must be authenticated)
const createDeclaration = async (req, res) => {
  try {
    const declaration = await Declaration.create({
      ...req.body,
      user: req.user._id, // from protect middleware
    });

    res.status(201).json({
      success: true,
      message: "Declaration created successfully",
      declaration,
    });
  } catch (error) {
    console.error("Error creating declaration:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Get all declarations of the logged-in user
const getMyDeclarations = async (req, res) => {
  try {
    const declarations = await Declaration.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, declarations });
  } catch (error) {
    console.error("Error fetching declarations:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { createDeclaration, getMyDeclarations };
