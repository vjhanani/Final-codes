// routes/rebateRoutes.js

const express = require("express");
const router = express.Router();

const rebateController = require("../controllers/rebateController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// student
router.post("/apply", protect, allowRoles("student"), rebateController.applyRebate);
router.post("/", protect, allowRoles("student"), rebateController.applyRebate); // Alias for frontend
router.get("/my", protect, allowRoles("student"), rebateController.getMyRebates);
router.delete("/:id", protect, allowRoles("student"), rebateController.deleteRebate);

// manager
router.get("/", protect, allowRoles("manager"), rebateController.getAllRebates);
router.get("/pending", protect, allowRoles("manager"), rebateController.getPendingRebates);
router.get("/approved", protect, allowRoles("manager"), rebateController.getApprovedRebates);

router.put("/approve/:id", protect, allowRoles("manager"), rebateController.approveRebate);
router.put("/reject/:id", protect, allowRoles("manager"), rebateController.rejectRebate);

module.exports = router;