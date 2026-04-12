// routes/feedbackRoutes.js

const express = require("express");
const router = express.Router();

const feedbackController = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// student
router.post("/", protect, allowRoles("student"), feedbackController.createFeedback);
router.get("/my", protect, allowRoles("student"), feedbackController.getMyFeedback);

// manager
router.get("/", protect, allowRoles("manager"), feedbackController.getAllFeedback);
router.get("/category/:category", protect, allowRoles("manager"), feedbackController.getFeedbackByCategory);
router.get("/stats", protect, allowRoles("manager"), feedbackController.getFeedbackStats);
router.put("/:id/status", protect, allowRoles("manager"), feedbackController.updateFeedbackStatus);

module.exports = router;