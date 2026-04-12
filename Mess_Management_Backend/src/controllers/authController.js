const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const MessManager = require("../models/MessManager");
const { sendOTPEmail } = require("../utils/mailer");
const axios = require("axios");
require("dotenv").config();
const API_FACE = process.env.VITE_API_FACE || 'http://localhost:8000';
const otpStore = {};

const generateToken = (user, role) => {
  return jwt.sign(
    { id: role === "student" ? user.rollNo : user.id, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.registerStudent = async (req, res) => {
  try {
    const { name, rollNo, email, password, roomNo, phone } = req.body;

    // optional IITK validation
    if (!email.endsWith("@iitk.ac.in")) {
      return res.status(400).json({ error: "Use IITK email" });
    }

    const existing = await Student.findOne({ where: { email } });
    if (existing && existing.status !== "Rejected") {
      return res.status(400).json({ error: "Student already exists" });
    }else if (existing && existing.status === "Rejected") {
      await existing.destroy(); // allow re-registration if previously rejected
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
      otp,
      data: { name, rollNo, email, password: hashedPassword, roomNo, phone },
      expires: Date.now() + 5 * 60 * 1000
    };

    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ error: "No OTP found" });
    }

    if (record.expires < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ error: "OTP expired" });
    }

    if (record.otp != otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const student = await Student.create(record.data);

    delete otpStore[email];

    const token = generateToken(student, "student");

    res.json({
      message: "Registration successful",
      token,
      student
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ error: "No pending registration" });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email].otp = newOtp;
    otpStore[email].expires = Date.now() + 5 * 60 * 1000;

    await sendOTPEmail(email, newOtp);

    res.json({ message: "OTP resent" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user;

    if (role === "student") {
      user = await Student.findOne({ where: { email } });
    } else {
      user = await MessManager.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = role=== "student" ? await bcrypt.compare(password, user.password) : password === user.password;

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (role === "student") {
      if (user.status === "Pending") {
        return res.status(403).json({
          error: "Your account is pending approval by manager"
        });
      }

      if (user.status === "Rejected") {
        return res.status(403).json({
          error: "Your account has been rejected"
        });
      }
    }

    const token = generateToken(user, role);

    res.json({
      message: "Login successful",
      token,
      role,
      status: user.status
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginFace = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image received" });

    // Fetch all students who have a face photo registered
    const students = await Student.findAll({
        where: { facePhoto: { [require('sequelize').Op.ne]: null } },
        attributes: ['rollNo', 'facePhoto', 'name', 'status']
    });

    if (students.length === 0) {
        return res.status(400).json({ error: "No student face profiles found in database." });
    }

    // Prepare gallery for comparison
    const gallery = students.map(s => ({
        id: s.rollNo,
        image: s.facePhoto
    }));

    const pythonResponse = await axios.post(`${API_FACE}/identify-face/`, { 
        probe: image,
        gallery: gallery
    });

    if (pythonResponse.data.status === "success") {
        const rollNo = pythonResponse.data.matchId; 
        const user = students.find(s => s.rollNo === rollNo);
        
        if (!user) {
            return res.status(400).json({ error: "Face recognized, but student record moved. Please login manually." });
        }

        if (user.status === "Pending") {
            return res.status(403).json({ error: "Your account is pending approval by manager" });
        }
        if (user.status === "Rejected") {
            return res.status(403).json({ error: "Your account has been rejected" });
        }

        const token = generateToken(user, "student");
        res.json({
            message: "Login successful",
            token,
            role: "student",
            status: user.status,
            user: { name: user.name, rollNo: user.rollNo, email: user.email }
        });
    } else {
        return res.status(400).json({ error: pythonResponse.data.message || "Face not recognized." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFacePhoto = async (req, res) => {
  try {
    const { image } = req.body;
    // Optional: allow empty image to clear it

    const student = await Student.findByPk(req.user.rollNo);
    if (!student) return res.status(404).json({ error: "Student not found" });

    student.facePhoto = image;
    await student.save();

    res.json({ message: "Face profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    let user;

    if (req.user.role === "student") {
      user = await Student.findByPk(req.user.rollNo);
    } else {
      user = await MessManager.findByPk(req.user.id);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Old password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const student = await Student.findByPk(req.user.rollNo, {
      attributes: { exclude: ["password"] }
    });

    res.json(student);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed to update this profile" });
    }

    const { name, roomNo, phone } = req.body;
    const student = await Student.findByPk(req.user.rollNo);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (name) student.name = name;
    if (roomNo !== undefined) student.roomNo = roomNo;
    if (phone !== undefined) student.phone = phone;

    await student.save();

    res.json({ message: "Profile updated successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 1. Request Password Reset OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    let user;

    // Check if user exists based on role
    if (role === "student") {
      user = await Student.findOne({ where: { email } });
    } else {
      user = await MessManager.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store in otpStore (Reuse existing store)
    otpStore[email] = {
      otp,
      role, // Store role to know which table to update later
      type: "password_reset",
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    const { sendOTPEmail } = require("../utils/mailer");
    await sendOTPEmail(email, otp);

    res.json({ message: "Reset OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Reset Password using OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = otpStore[email];

    // Validations
    if (!record || record.type !== "password_reset") {
      return res.status(400).json({ error: "No reset request found" });
    }

    if (record.expires < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ error: "OTP expired" });
    }

    if (record.otp != otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the correct table based on stored role
    if (record.role === "student") {
      await Student.update({ password: hashedPassword }, { where: { email } });
    } else {
      await MessManager.update({ password: hashedPassword }, { where: { email } });
    }

    // Clean up store
    delete otpStore[email];

    res.json({ message: "Password reset successful. You can now login." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
