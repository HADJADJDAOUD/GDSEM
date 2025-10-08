const FormHeuresSup = require("../modules/FormHeuresSup.js");

// ✅ Create new form (owned by logged-in user)
exports.createFormHeuresSup = async (req, res) => {
    console.log("Request body:", req.body);
  try {
    const form = await FormHeuresSup.create({
      ...req.body,
      user: req.user._id, // from protect middleware
    });
        console.log("Form created:", form);
    res.status(201).json({
      success: true,
      message: "FormHeuresSup created successfully",
      form,
    });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get all forms of the logged-in user
exports.getMyFormHeuresSup = async (req, res) => {
  try {
    const forms = await FormHeuresSup.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
