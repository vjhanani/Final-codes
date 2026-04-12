// routes/preBookingRoutes.js
const express = require("express");
const router = express.Router();
const preBookingController = require("../controllers/preBookingController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post("/", protect, allowRoles("student"), preBookingController.bookItem);
router.get("/my", protect, allowRoles("student"), preBookingController.getMyBookings);
router.get("/", protect, allowRoles("manager"), preBookingController.getAllBookings);
router.put("/status/:id", protect, allowRoles("manager"), preBookingController.updateBookingStatus);

module.exports = router;
