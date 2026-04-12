// controllers/transactionController.js
const { Transaction, Student, Rebate } = require("../models/Index");

exports.getStudentTransactions = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const transactions = await Transaction.findAll({
      where: { StudentRollNo: req.user.rollNo },
      order: [["date", "DESC"]]
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { studentRollNo, itemName, amount, type, date } = req.body;

    if (!studentRollNo || !amount || !type) {
      return res.status(400).json({ error: "Student roll number, amount, and type are required" });
    }

    const student = await Student.findByPk(studentRollNo);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const transaction = await Transaction.create({
      StudentRollNo: studentRollNo,
      itemName,
      amount,
      type,
      date: date || new Date(),
      status: 'Completed'
    });

    res.json({ message: "Transaction recorded", transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDuesSummary = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const studentRollNo = req.user.rollNo;

    const transactions = await Transaction.findAll({
      where: { StudentRollNo: studentRollNo }
    });

    let totalCharges = 0;
    let totalExtras = 0;
    let totalPayments = 0;
    let totalRebates = 0;

    transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'charge' || t.type === 'Monthly Charge') {
        totalCharges += amt;
      } else if (t.type === 'extra' || t.type === 'Extra Item') {
        totalExtras += amt;
      } else if (t.type === 'payment' || t.type === 'Payment') {
        totalPayments += amt;
      } else if (t.type === 'rebate' || t.type === 'Rebate') {
        totalRebates += amt;
      }
    });

    const netDues = (totalCharges + totalExtras) - (totalPayments + totalRebates);

    res.json({
      totalCharges,
      totalExtras,
      totalPayments,
      totalRebates,
      netDues
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
