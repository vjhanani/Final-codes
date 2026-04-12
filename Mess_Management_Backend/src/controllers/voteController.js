// controllers/voteController.js

const Vote = require("../models/Vote");
const Poll = require("../models/Poll");
const PollOption = require("../models/PollOption");


exports.castVote = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can vote" });
    }

    const { pollId, votes } = req.body;
    const studentId = req.user.rollNo;

    // check poll
    const poll = await Poll.findByPk(pollId);
    if (!poll || poll.status !== "active") {
      return res.status(400).json({ error: "Voting not active" });
    }

    // Get all available meal types for this poll
    const optionsContext = await PollOption.findAll({
      where: { PollId: pollId }
    });
    const availableMealTypes = [...new Set(optionsContext.map(o => o.mealType))];

    // check full selection
    const missingMeals = availableMealTypes.filter(meal => !votes[meal]);
    if (missingMeals.length > 0) {
      return res.status(400).json({
        error: `Select option for: ${missingMeals.join(', ')}`,
      });
    }

    // check already voted to handle vote update
    const existingVotes = await Vote.findAll({
      where: { PollId: pollId, StudentRollNo: studentId },
    });

    // First validate all new options
    const optionsToVoteFor = [];
    for (const mealType in votes) {
      const optionId = votes[mealType];

      const option = await PollOption.findOne({
        where: { id: optionId, PollId: pollId, mealType },
      });

      if (!option) {
        return res.status(400).json({
          error: `Invalid option for ${mealType}`,
        });
      }
      optionsToVoteFor.push({ optionId, option });
    }

    // If validation passes, we can safely remove old votes and process update
    let isUpdate = false;
    if (existingVotes.length > 0) {
      isUpdate = true;
      // Decrement the old options
      for (const oldVote of existingVotes) {
        const oldOption = await PollOption.findByPk(oldVote.PollOptionId);
        if (oldOption && oldOption.votes > 0) {
          await oldOption.decrement("votes");
        }
      }
      // Delete old votes
      await Vote.destroy({
        where: { PollId: pollId, StudentRollNo: studentId }
      });
    }

    // Insert new votes and increment Option vote count
    for (const { optionId, option } of optionsToVoteFor) {
      await Vote.create({
        PollId: pollId,
        PollOptionId: optionId,
        StudentRollNo: studentId,
      });

      await option.increment("votes");
    }

    res.json({ message: isUpdate ? "Vote updated successfully!" : "Vote submitted successfully!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyVotes = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can fetch their votes" });
    }
    const studentId = req.user.rollNo;
    const votes = await Vote.findAll({
      where: { StudentRollNo: studentId }
    });
    res.json(votes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};