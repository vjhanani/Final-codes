const express = require("express");
const router = express.Router();

const announcementController = require("../controllers/announcementController");
const { protect } = require("../middleware/authMiddleware");

// Both students and manager can get announcements
router.get("/", protect, announcementController.getAnnouncements);

// Only managers can create or delete (role checking is inside controller)
router.post("/", protect, announcementController.createAnnouncement);
router.delete("/:id", protect, announcementController.deleteAnnouncement);

module.exports = router;
