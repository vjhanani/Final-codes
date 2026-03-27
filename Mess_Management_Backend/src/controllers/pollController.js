// controllers/pollController.js

const Poll = require("../models/Poll");
const PollOption = require("../models/PollOption");
const Vote = require("../models/Vote");


exports.createPoll = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { title, description, options } = req.body;

    // Check if a similar active or scheduled poll already exists
    const existingPoll = await Poll.findOne({
      where: {
        title,
        description,
        status: ["active", "scheduled"]
      }
    });

    if (existingPoll) {
      return res.status(400).json({ error: "An active or scheduled poll with the same title and description already exists" });
    }

    const poll = await Poll.create({
      title,
      description,
      status: "scheduled",
    });

    for (const mealType in options) {
      for (const item of options[mealType]) {
        await PollOption.create({
          name: item,
          mealType,
          PollId: poll.id,
        });
      }
    }

    res.json({ message: "Poll created", poll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.startPoll = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const poll = await Poll.findByPk(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    poll.status = "active";
    poll.startDate = new Date();
    await poll.save();

    res.json({ message: "Poll started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.endPoll = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const poll = await Poll.findByPk(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    poll.status = "closed";
    poll.endDate = new Date();
    await poll.save();

    res.json({ message: "Poll ended" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updatePollOptions = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { options } = req.body;

    await PollOption.destroy({
      where: { PollId: req.params.id },
    });

    for (const mealType in options) {
      for (const item of options[mealType]) {
        await PollOption.create({
          name: item,
          mealType,
          PollId: req.params.id,
        });
      }
    }

    res.json({ message: "Poll updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.findAll({
      include: [{ model: PollOption }],
    });

    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const poll = await Poll.findByPk(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    await Vote.destroy({ where: { PollId: req.params.id } });
    await PollOption.destroy({ where: { PollId: req.params.id } });
    await poll.destroy();

    res.json({ message: "Poll deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};