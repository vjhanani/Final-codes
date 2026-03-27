const Rebate = require("../models/Rebate");
const Student = require("../models/Student");
const { Config } = require("../models/Index");
const { Op } = require("sequelize");

const calculateAmount = async (startDate) => {
  const date = new Date(startDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const configKey = `BDMR_${year}_${month}`;
  
  const bdmrConfig = await Config.findByPk(configKey);
  if (!bdmrConfig) return null; 
  
  return parseFloat(bdmrConfig.value);
};

const getDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

exports.applyRebate = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start date and end date required"
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        error: "Invalid date range"
      });
    }

    const overlap = await Rebate.findOne({
      where: {
        StudentRollNo: req.user.rollNo,
        startDate: {
          [Op.lte]: endDate
        },
        endDate: {
          [Op.gte]: startDate
        }
      }
    });

    if (overlap) {
      return res.status(400).json({
        error: "Rebate request interval overlaps with previous request"
      });
    }

    const bdmr = await calculateAmount(startDate);
    const amount = bdmr ? (getDays(startDate, endDate) * bdmr) : 0;

    const rebate = await Rebate.create({
      StudentRollNo: req.user.rollNo,
      startDate,
      endDate,
      reason,
      status: "Pending",
      amount
    });

    res.json({
      message: bdmr ? "Rebate request submitted" : "Rebate submitted (Note: BDMR not set for this month, amount is 0)",
      rebate
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyRebates = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const rebates = await Rebate.findAll({
      where: { StudentRollNo: req.user.rollNo },
      order: [["createdAt", "DESC"]]
    });

    res.json(rebates);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRebates = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const rebates = await Rebate.findAll({
      include: [{ model: Student }],
      order: [["createdAt", "DESC"]]
    });

    res.json(rebates);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingRebates = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const rebates = await Rebate.findAll({
      where: { status: "Pending" },
      include: [{ model: Student }]
    });

    res.json(rebates);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApprovedRebates = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const rebates = await Rebate.findAll({
      where: { status: "Approved" },
      include: [{ model: Student }]
    });

    res.json(rebates);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveRebate = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const rebate = await Rebate.findByPk(req.params.id);

    if (!rebate) {
      return res.status(404).json({ error: "Rebate not found" });
    }

    const bdmr = await calculateAmount(rebate.startDate);
    const amount = bdmr ? (getDays(rebate.startDate, rebate.endDate) * bdmr) : 0;
    
    rebate.status = "Approved";
    rebate.amount = amount;
    await rebate.save();

    res.json({
      message: bdmr ? "Rebate approved" : "Rebate approved (Note: BDMR for this month was not set, amount is 0)",
      rebate
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectRebate = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const rebate = await Rebate.findByPk(req.params.id);

    if (!rebate) {
      return res.status(404).json({ error: "Rebate not found" });
    }

    rebate.status = "Rejected";
    await rebate.save();

    res.json({
      message: "Rebate rejected",
      rebate
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
