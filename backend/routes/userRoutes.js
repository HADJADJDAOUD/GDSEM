// routes/userRoute.js
const express = require("express");
const {
  login,
  createAbsence,
  getMyAbsences,
  acceptAbsence,
  deleteAbsence,
  getPendingAbsences,
  getUserAbsences,
  getMyLatestAbsence,
  getAcceptedAbsences,
  declineAbsence,
  getMyRejectedAbsences,
  getUserRejectedAbsences,
} = require("../controllers/userController.js");
const {createFormHeuresSup  , getMyFormHeuresSup } = require( "../controllers/formHeuresSupController.js");
const { createDeclaration, getMyDeclarations } = require("../controllers/declarationController.js");
const { createTransportDeclaration, getMyTransportDeclarations } = require("../controllers/transportDeclarationController.js");
const { createDemandePrestation, getMyDemandesPrestations } = require("../controllers/demandePrestationController.js");
const { protect, restrictTo, verifyToken } = require("../utils/middleware.js");
const uploadRouter = require("./upload.js");
const router = express.Router();

/////////////////
// normal user routes
/////////////////

router.post("/login", login); // working
router.post("/absences", protect, createAbsence); // create absence (owner)
router.get("/absences/me", protect, getMyAbsences); // get my absences
router.get("/verifyToken", verifyToken);
router.get("/getMyLastAbs/:userId", protect, getMyLatestAbsence);
router.get("/myRejectedAbsences", protect, getMyRejectedAbsences);
////////////////////////////////////////////
// admin (RH/DRH) routes + owner-capable routes
//////////////////////////////////////////////////

// Accept an absence (kept restricted to RH/DRH — change if you want owners to be able to do this)
router.patch(
  "/absences/:absenceId/accept",
  protect,
  restrictTo("RH", "DRH"),
  acceptAbsence
);
router.post("/upload", uploadRouter);
// Delete an absence (soft remove). Controller allows owner OR RH/DRH.
// Do NOT restrict here so the owner can delete their own absence; controller enforces permissions.
router.delete("/absences/:absenceId/delete", protect, deleteAbsence);

// List pending absences across users (RH dashboard)
router.get(
  "/absences/pending",
  protect,
  restrictTo("RH", "DRH"),
  getPendingAbsences
);
router.get(
  "/absences/accepted",
  protect,
  restrictTo("RH", "DRH"),
  getAcceptedAbsences
);
router.post(
  "/absences/:absenceId/decline",
  protect,
  restrictTo("RH", "DRH"),
  declineAbsence
);
router.get("/userRejectedAbsences/:userId", protect, getUserRejectedAbsences);

// Admin: get a specific user's absences
router.get("/:id/absences", protect, restrictTo("RH", "DRH"), getUserAbsences);



///  forms routes
router.post('/formHeuresSup', protect, createFormHeuresSup);
router.get('/formHeuresSup/me', protect, getMyFormHeuresSup);
router.post("/declarations", protect, createDeclaration);
router.get("/declarations/me", protect, getMyDeclarations);
router.post("/transport", protect, createTransportDeclaration);
router.get("/transport/me", protect, getMyTransportDeclarations);
router.post("/demandesPrestations", protect, createDemandePrestation);
router.get("/demandesPrestations/me", protect, getMyDemandesPrestations);

module.exports = router;  
