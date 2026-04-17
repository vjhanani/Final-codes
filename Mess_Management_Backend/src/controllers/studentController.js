// controllers/studentController.js

const Student = require("../models/Student");

exports.getPendingStudents = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const students = await Student.findAll({
      where: { status: "Pending" },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]]
    });

    res.json(students);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApprovedStudents = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const students = await Student.findAll({
      where: { status: "Approved" },
      attributes: { exclude: ["password"] }
    });

    res.json(students);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveStudent = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const student = await Student.findByPk(req.params.rollNo);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (student.status === "Approved") {
      return res.status(400).json({
        error: "Student already approved"
      });
    }

    student.status = "Approved";
    student.messCardStatus = "Active";

    await student.save();

    res.json({
      message: "Student approved",
      student
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const student = await Student.findByPk(req.params.rollNo);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    student.status = "Rejected";
    student.messCardStatus = "Suspended";

    await student.save();

    res.json({
      message: "Student rejected",
      student
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const students = await Student.findAll({
      attributes: { exclude: ["password"] }
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const student = await Student.findByPk(req.params.rollNo);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    await student.destroy();

    res.json({
      message: "Student deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleMessStatus = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const student = await Student.findByPk(req.params.rollNo);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Toggle between Active and Suspended
    console.log(`[TOGGLE STATUS] Student ${student.rollNo} Current: messCardStatus=${student.messCardStatus}, status=${student.status}`);
    
    const currentMessStatus = (student.messCardStatus || "").toLowerCase();
    
    if (currentMessStatus === "active") {
      student.messCardStatus = "Suspended";
      // We don't necessarily change status to Rejected here, just suspend mess access
    } else {
      student.messCardStatus = "Active";
      // Force account to Approved if we are activating their mess access
      student.status = "Approved"; 
    }
    
    await student.save();
    console.log(`[TOGGLE STATUS] Student ${student.rollNo} New: messCardStatus=${student.messCardStatus}, status=${student.status}`);

    res.json({
      message: `Status updated to ${student.messCardStatus}`,
      student
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
