const express = require("express");
const {
  login,
  createAbsence,
  getMyAbsences,
  acceptAbsence,
  deleteAbsence,
  getPendingAbsences,
  getUserAbsences,
} = require("../controllers/userController.js");
const {protect, restrictTo} = require("../utils/middleware.js");
const router = express.Router();



/////////////////
//////////////
// this is what normal user can do 
//////////////////

router.post("/login", login); /// working
router.post("/absences", protect, createAbsence); // working
router.get("/absences/me", protect, getMyAbsences);  // working 

//////////////////////////////////////////////////
///////////// here where can do RH and DRH /////////////    
//////////////////////////////////////////////////


router.delete("/absences/:userId/:absenceId/delete", protect, restrictTo("RH", "DRH"), deleteAbsence); // ensure params in request match
router.patch(
  "/absences/:userId/:absenceId/accept",
  protect,
  restrictTo("RH", "DRH"),
  acceptAbsence // working
);
router.get(
  "/absences/pending",
  protect,
  restrictTo("RH", "DRH"),
  getPendingAbsences   // working 
);
router.get(
  "/:id/absences",
  protect,
  restrictTo("RH", "DRH"),
  getUserAbsences // working
);

module.exports = router;