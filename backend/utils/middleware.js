/**
 * protect middleware:
 * - expects Authorization: Bearer <token>
 * - sets req.user to the user doc (without password)
 */
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const User = require("../modules/usermodule"); // adjust path if needed
const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      typeof req.headers.authorization === "string" &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ status: "fail", message: "Not logged in" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid or expired token" });
    }
    console.log("the decoded token", decoded.id);

    const user = await User.findById(decoded.id).select("-password");
    console.log("the user from the db", user);
    if (!user)
      return res
        .status(401)
        .json({ status: "fail", message: "User no longer exists" });
    console.log("the user in protect middleware", user);

    req.user = user; // attach mongoose doc (safe - password excluded)
    next();
  } catch (err) {
    console.error("Protect error:", err);
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
    if (!req.user)
      return res
        .status(500)
        .json({ status: "error", message: "protect must run first" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "Forbidden: insufficient permissions",
      });
    }
    next();
  };
};
