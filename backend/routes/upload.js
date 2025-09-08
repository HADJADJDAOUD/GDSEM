// routes/upload.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../utils/middleware"); // reuse your protect middleware

const router = express.Router();

// ensure uploads dir exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// disk storage with safe unique filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // sanitize + unique filename
    const safe = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    const unique = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}_${safe}`;
    cb(null, unique);
  },
});

// file filter: allow images & pdfs only (adjust as you need)
function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext) || allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images or PDFs are allowed"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
});

router.post(
  "/uploadProof",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ status: "fail", message: "No file uploaded" });
      }

      // construct public URL pointing to the static route we set (adjust host/port if needed)
      // If your backend runs at http://localhost:5000, URLs will be like http://localhost:5000/uploads/filename
      const host = req.get("host"); // includes port
      const protocol = req.protocol; // http or https
      const url = `${protocol}://${host}/uploads/${encodeURIComponent(
        req.file.filename
      )}`;

      return res.status(201).json({ status: "success", url });
    } catch (err) {
      console.error("uploadProof error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Upload failed" });
    }
  }
);

module.exports = router;
