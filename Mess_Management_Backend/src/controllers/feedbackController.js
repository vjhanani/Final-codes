// controllers/feedbackController.js

const Feedback = require("../models/Feedback");
const Student = require("../models/Student");
const { Op } = require("sequelize");

exports.createFeedback = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const { rating, comment, category, isAnonymous } = req.body;

    if (!rating) {
      return res.status(400).json({ error: "Rating is required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5"
      });
    }

    const existing = await Feedback.findOne({
      where: {
        StudentRollNo: req.user.rollNo,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        error: "You can submit only one feedback per day"
      });
    }

    const feedback = await Feedback.create({
      StudentRollNo: req.user.rollNo,
      rating,
      comment,
      category,
      isAnonymous: isAnonymous || false
    });

    res.json({
      message: "Feedback submitted",
      feedback
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const feedbacks = await Feedback.findAll({
      where: { StudentRollNo: req.user.rollNo },
      order: [["createdAt", "DESC"]]
    });

    res.json(feedbacks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const feedbacks = await Feedback.findAll({
      include: [{ model: Student }],
      order: [["createdAt", "DESC"]]
    });

    const parsedFeedbacks = feedbacks.map(f => {
      const raw = f.toJSON();
      if (raw.isAnonymous) {
        raw.StudentRollNo = "Hidden";
        raw.Student = { name: "Anonymous", rollNo: "Hidden" };
      }
      return raw;
    });

    res.json(parsedFeedbacks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbackByCategory = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { category } = req.params;

    const feedbacks = await Feedback.findAll({
      where: { category },
      include: [{ model: Student }]
    });

    const parsedFeedbacks = feedbacks.map(f => {
      const raw = f.toJSON();
      if (raw.isAnonymous) {
        raw.StudentRollNo = "Hidden";
        raw.Student = { name: "Anonymous", rollNo: "Hidden" };
      }
      return raw;
    });

    res.json(parsedFeedbacks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbackStats = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const feedbacks = await Feedback.findAll();

    let total = feedbacks.length;
    let avgRating = 0;
    let categoryStats = {};

    feedbacks.forEach(f => {
      avgRating += f.rating;

      if (!categoryStats[f.category]) {
        categoryStats[f.category] = {
          count: 0,
          totalRating: 0
        };
      }

      categoryStats[f.category].count += 1;
      categoryStats[f.category].totalRating += f.rating;
    });

    avgRating = total ? (avgRating / total).toFixed(2) : 0;

    // calculate category avg
    for (let cat in categoryStats) {
      categoryStats[cat].average =
        (categoryStats[cat].totalRating / categoryStats[cat].count).toFixed(2);
    }

    res.json({
      totalFeedbacks: total,
      averageRating: avgRating,
      categories: categoryStats
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
