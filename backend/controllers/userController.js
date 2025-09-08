// controllers.js
// Auth + Absence controllers and some middleware.
// Requires: npm i bcryptjs jsonwebtoken
// Adjust model require paths to your project layout.

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../modules/usermodule"); // <- adjust path if needed
const Absence = require("../modules/absenceModule"); // <- adjust path if needed
const RejectedAbsence = require("../modules/RejectedAbsence"); // <- adjust path if needed
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/* -------------------------
   Helpers
   ------------------------- */
const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const sendToken = (res, user, statusCode = 200) => {
  const token = signToken(user);
  // Never send password back.
  const safeUser = user.toObject ? user.toObject() : user;
  delete safeUser.password;
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user: safeUser },
  });
};

/* -------------------------
   AUTH CONTROLLERS
   ------------------------- */

/**
 * POST /api/login
 * body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "fail", message: "Provide email and password" });
    }

    // need password field explicitly because schema has select:false
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid credentials" });

    const correct = await bcrypt
      .compare(password, user.password)
      .catch(() => false);
    if (!correct)
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid credentials" });

    // remove password before sending
    user.password = undefined;
    sendToken(res, user, 200);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/* -------------------------
   ABSENCE CONTROLLERS
   ------------------------- */

/**
 * POST /api/absences
 * Body: { startDate, endDate, type, proofUrl? }
 * Requires: protect (req.user must be set)
 */
exports.createAbsence = async (req, res) => {
  try {
    const { startDate, endDate, type, proofUrl } = req.body || {};
    // basic validation
    if (!startDate || !endDate || !type) {
      return res.status(400).json({
        status: "fail",
        message: "startDate, endDate and type are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.error("User not found in createAbsence:", req.user._id);
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    // Convert dates to a comparable format
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);
    const userEndDate = user.endDate ? new Date(user.endDate) : null;

    // The core logic: ensure new start doesn't come before user's endDate
    if (userEndDate && newStartDate < userEndDate) {
      return res.status(400).json({
        status: "fail",
        message: `Please start from this date: ${
          userEndDate.toISOString().split("T")[0]
        }`,
      });
    }

    // create absence doc referencing user
    const absenceDoc = await Absence.create({
      user: user._id,
      startDate: newStartDate,
      endDate: newEndDate,
      type,
      proofUrl: proofUrl || null,
    });

    // we update user.endDate when he accpeted from RH or DRH in the acceptAbsence controller
    // so here we do NOT update user.endDate when creating a mere request
    
    await user.save();

    res.status(201).json({ status: "success", data: absenceDoc });
  } catch (err) {
    console.error("createAbsence error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ status: "fail", message: messages.join(". ") });
    }
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * GET /api/absences/me
 * Returns current user's absences (filtered removed=false)
 * Requires: protect
 */
exports.getMyAbsences = async (req, res) => {
  try {
    const abs = await Absence.find({ user: req.user._id, removed: false }).sort(
      {
        createdAt: -1,
      }
    );
    res.json({ status: "success", results: abs.length, data: abs });
  } catch (err) {
    console.error("getMyAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

// controllers/userController.js
exports.getMyLatestAbsence = async (req, res) => {
  try {
    const absence = await Absence.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .exec();

    if (!absence) {
      return res.status(404).json({ status: "fail", message: "No absences found" });
    }
    console.log("Found latest absence:", absence);

    res.json({ status: "success", data: absence });
  } catch (err) {
    console.error("getMyLatestAbsence error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};



/**
 * GET /api/users/:id/absences
 * For admins (RH/DRH) to see a specific user's absences
 * Requires: protect + restrictTo('RH','DRH')
 */
exports.getUserAbsences = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid user id" });

    const user = await User.findById(id).select("username email");
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });

    const abs = await Absence.find({ user: id, removed: false }).sort({
      createdAt: -1,
    });

    res.json({
      status: "success",
      results: abs.length,
      data: {
        user: { username: user.username, email: user.email },
        absences: abs,
      },
    });
  } catch (err) {
    console.error("getUserAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * PATCH /api/absences/:absenceId/accept
 * Accepts an absence (sets status='accepted')
 * Requires: protect + restrictTo('RH','DRH') OR owner depending on policy
 */
exports.acceptAbsence = async (req, res) => {
  try {
    const absenceId = req.params.absenceId || req.params.aid;
    if (!mongoose.Types.ObjectId.isValid(absenceId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid absence id" });
    }

    const absence = await Absence.findById(absenceId);
    if (!absence || absence.removed)
      return res
        .status(404)
        .json({ status: "fail", message: "Absence not found" });

    // permission: allow RH/DRH only to accpet (not owner)
    const isAdmin = ["RH", "DRH"].includes(req.user.role);
    if (!isAdmin)
      return res.status(403).json({ status: "fail", message: "Forbidden" });

// here we update user.endDate when he accpeted from RH or DRH

    const user = await User.findById(absence.user);
    if (user) {
      const absenceEndDate = new Date(absence.endDate);
      user.endDate = absenceEndDate;
      await user.save();
    }

    absence.status = "accepted";
    await absence.save();

    res.json({ status: "success", data: absence });
  } catch (err) {
    console.error("acceptAbsence error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * DELETE /api/absences/:absenceId
 * Soft-remove an absence (sets removed=true)
 * Requires: protect (owner or RH/DRH)
 */
const fs = require("fs");
const path = require("path");

exports.deleteAbsence = async (req, res) => {
  try {
    console.log("deleteAbsence called with params:", req.params.absenceId);
    const absenceId = req.params.absenceId || req.params.aid;

    if (!mongoose.Types.ObjectId.isValid(absenceId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid absence id" });
    }

    const absence = await Absence.findById(absenceId);
    if (!absence) {
      return res
        .status(404)
        .json({ status: "fail", message: "Absence not found" });
    }

    // permission check
    const isOwner = String(req.user._id) === String(absence.user);
    const isAdmin = ["RH", "DRH"].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ status: "fail", message: "Forbidden" });
    }

    // 🔥 If absence has a proofUrl, try deleting the file
    if (absence.proofUrl) {
      try {
        // Extract filename from URL (after /uploads/)
        const fileName = decodeURIComponent(
          absence.proofUrl.split("/uploads/")[1]
        );
        if (fileName) {
          const filePath = path.join(__dirname, "..", "uploads", fileName);
          fs.unlink(filePath, (err) => {
            if (err) {
              console.warn("Failed to delete file:", filePath, err.message);
            } else {
              console.log("Deleted file:", filePath);
            }
          });
        }
      } catch (e) {
        console.error("Error extracting file name from proofUrl:", e);
      }
    }

    // Remove absence document
    await Absence.findByIdAndDelete(absenceId);

    res.status(200).json({ status: "success", message: "Absence deleted" });
  } catch (err) {
    console.error("deleteAbsence error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};



/**
 * GET /api/absences/pending
 * Lists all pending absences across users (for RH dashboard)
 * Requires: protect + restrictTo('RH','DRH')
 *
 * Returns array of { userId, username, email, absence }
 */
exports.getPendingAbsences = async (req, res) => {
  try {
    const pending = await Absence.find({ status: "pending" })
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .limit(1000);

    // map to the previous shape (optional)
    const results = pending.map((p) => ({
      userId: p.user ? p.user._id : null,
      username: p.user ? p.user.username : null,
      email: p.user ? p.user.email : null,
      absence: p,
    }));

    res.json({ status: "success", results: results.length, data: results });
  } catch (err) {
    console.error("getPendingAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.getAcceptedAbsences = async (req, res) => {
  try {
    const accepted = await Absence.find({ status: "accepted", removed: false })
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .limit(1000);
    res.json({ status: "success", results: accepted.length, data: accepted });
  } catch (err) {
    console.error("getAcceptedAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.declineAbsence = async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { justification } = req.body;

    if (!justification || justification.trim().length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Justification is required to decline an absence",
      });
    }

    const absence = await Absence.findById(absenceId).populate("user");
    if (!absence) {
      return res
        .status(404)
        .json({ status: "fail", message: "Absence not found" });
    }

    // Create rejected absence entry
    await RejectedAbsence.create({
      user: absence.user._id,
      startDate: absence.startDate,
      endDate: absence.endDate,
      type: absence.type,
      proofUrl: absence.proofUrl,
      justification,
    });

    // Remove from main Absence collection
    await absence.deleteOne();

    res.status(200).json({ status: "success", message: "Absence declined" });
  } catch (err) {
    console.error("declineAbsence error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.getMyRejectedAbsences = async (req, res) => {
  try {
    const userId = req.user._id; // assumes auth middleware sets req.user

    const rejected = await RejectedAbsence.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      results: rejected.length,
      data: rejected,
    });
  } catch (err) {
    console.error("getMyRejectedAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};