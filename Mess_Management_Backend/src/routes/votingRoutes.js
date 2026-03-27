// routes/pollRoutes.js

const express = require("express");
const router = express.Router();

const pollController = require("../controllers/pollController");
const voteController = require("../controllers/voteController");
const resultController = require("../controllers/resultController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// manager
router.post("/create", protect, allowRoles("manager"), pollController.createPoll);
router.put("/start/:id", protect, allowRoles("manager"), pollController.startPoll);
router.put("/end/:id", protect, allowRoles("manager"), pollController.endPoll);
router.put("/update/:id", protect, allowRoles("manager"), pollController.updatePollOptions);
router.delete("/:id", protect, allowRoles("manager"), pollController.deletePoll);

// student
router.get("/my", protect, allowRoles("student"), voteController.getMyVotes);
router.post("/vote", protect, allowRoles("student"), voteController.castVote);

// both
router.get("/", protect, pollController.getAllPolls);
router.get("/results/:id", protect, resultController.getPollResults);

module.exports = router;