// routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// student
router.get("/my", protect, allowRoles("student"), transactionController.getStudentTransactions);
router.get("/summary", protect, allowRoles("student"), transactionController.getDuesSummary);

// manager
router.post("/add", protect, allowRoles("manager"), transactionController.addTransaction);

module.exports = router;
