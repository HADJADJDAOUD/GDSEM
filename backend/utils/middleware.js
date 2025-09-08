// middleware/auth.js
// Protect + restrictTo + verifyToken
// Keep require paths consistent with your project.

const jwt = require("jsonwebtoken");
const User = require("../modules/usermodule"); // adjust path if needed

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

/**
 * protect middleware:
 * - expects Authorization: Bearer <token>
 * - sets req.user to the user doc (without password)
 */
exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || typeof auth !== "string") {
      return res
        .status(401)
        .json({ status: "fail", message: "Not logged in (no token)" });
    }

    // Accept "Bearer <token>" (case-insensitive Bearer)
    const parts = auth.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid authorization header" });
    }

    const token = parts[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // give a clear 401 for token issues (expired/invalid)
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid or expired token" });
    }

    if (!decoded || !decoded.id) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Protect error:", err);
    // this is an unexpected server error
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/* -------------------------
   AUTH MIDDLEWARE
   ------------------------- */

/**
 * restrictTo(...roles)
 * usage: restrictTo('RH','DRH')
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(500)
        .json({ status: "error", message: "protect must run first" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "Forbidden: insufficient permissions",
      });
    }
    next();
  };
};

/**
 * verifyToken - lightweight endpoint for frontend token checks
 * returns decoded payload if token valid
 */
exports.verifyToken = (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || typeof authHeader !== "string")
      return res.status(401).json({ valid: false, error: "No token" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]))
      return res
        .status(401)
        .json({ valid: false, error: "Invalid authorization header" });

    const token = parts[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ valid: true, user: decoded });
    } catch (err) {
      return res
        .status(401)
        .json({ valid: false, error: "Invalid or expired" });
    }
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(500).json({ valid: false, error: "Server error" });
  }
};
