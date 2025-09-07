// controllers.js
// Auth + Absence controllers and some middleware.
// Drop into your project and wire routes to these handlers.
// Requires: npm i bcryptjs jsonwebtoken

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../modules/usermodule"); // adjust path if needed

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
 * Requires: protect
 */
exports.createAbsence = async (req, res) => {
  try {
    const { startDate, endDate, type, proofUrl } = req.body || {};
    // basic validation (Mongoose will re-validate on save as well)
    if (!startDate || !endDate || !type) {
      return res.status(400).json({
        status: "fail",
        message: "startDate, endDate and type are required",
      });
    }

    // push subdoc
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });

    user.absences.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      proofUrl: proofUrl || null,
      // status defaults to 'pending'
    });

    await user.save(); // triggers validations on subdoc
    const newAbs = user.absences[user.absences.length - 1];
    res.status(201).json({ status: "success", data: newAbs });
  } catch (err) {
    console.error("createAbsence error:", err);
    // if validation error from mongoose, return 400 with message
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
    const user = await User.findById(req.user._id).select("absences");
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    const abs = user.absences.filter((a) => !a.removed);
    res.json({ status: "success", results: abs.length, data: abs });
  } catch (err) {
    console.error("getMyAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};



//////////////////
/////////////////////
////////////////////
// here where can do RH and DRH /////////////
/////////////////////
/////////////////////
/////////////////////
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
    const user = await User.findById(id).select("username email absences");
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    const abs = user.absences.filter((a) => !a.removed);
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
 * PATCH /api/absences/:userId/:absenceId/accept
 * Accepts an absence (sets status='accepted')
 * Requires: protect + restrictTo('RH','DRH')
 */
exports.acceptAbsence = async (req, res) => {
  try {
    const { userId, absenceId } = {
      userId: req.params.userId || req.params.id,
      absenceId: req.params.absenceId || req.params.aid,
    };
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(absenceId)
    ) {
      return res.status(400).json({ status: "fail", message: "Invalid id(s)" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });

    const sub = user.absences.id(absenceId);
    if (!sub || sub.removed)
      return res
        .status(404)
        .json({ status: "fail", message: "Absence not found" });

    sub.status = "accepted";
    await user.save();
    res.json({ status: "success", data: sub });
  } catch (err) {
    console.error("acceptAbsence error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * DELETE /api/absences/:userId/:absenceId
 * Remove an absence subdocument (hard delete)
 * Requires: protect (owner or RH/DRH)
 *
 * If you prefer soft-delete, change to set removed=true instead of sub.remove()
 */
exports.deleteAbsence = async (req, res) => {
  try {
    const { userId, absenceId } = {
      userId: req.params.userId || req.params.id,
      absenceId: req.params.absenceId || req.params.aid,
    };
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(absenceId)
    ) {
      return res.status(400).json({ status: "fail", message: "Invalid id(s)" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });

    const sub = user.absences.id(absenceId);
    if (!sub)
      return res
        .status(404)
        .json({ status: "fail", message: "Absence not found" });

    // permission: allow owner or RH/DRH
    const isOwner = req.user._id.equals(user._id);
    const isAdmin = ["RH", "DRH"].includes(req.user.role);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ status: "fail", message: "Forbidden" });

    // hard delete:
    sub.set({ removed: true });
    await user.save();
    res.status(204).json({ status: "success", data: null });
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
    // aggregation to unwind absences and filter
    const pipeline = [
      { $unwind: "$absences" },
      { $match: { "absences.status": "pending", "absences.removed": false } },
      {
        $project: {
          userId: "$_id",
          username: "$username",
          email: "$email",
          absence: "$absences",
        },
      },
      { $sort: { "absence.createdAt": -1 } },
      { $limit: 1000 }, // safety cap
    ];

    const results = await User.aggregate(pipeline);
    res.json({ status: "success", results: results.length, data: results });
  } catch (err) {
    console.error("getPendingAbsences error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};
