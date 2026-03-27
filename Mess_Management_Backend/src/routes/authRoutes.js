// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// student register
router.post("/register", authController.registerStudent);
router.post("/verify-otp", authController.verifyOTP);
router.post("/resend-otp", authController.resendOTP);

// login
router.post("/login", authController.login);
router.post("/login-face", authController.loginFace);

// change password
router.put("/change-password", protect, authController.changePassword);

// update face photo (student only)
router.post("/update-face-photo", protect, authController.updateFacePhoto);

// profile
router.get("/profile", protect, authController.getProfile);
router.put("/profile", protect, authController.updateProfile);

// forgot password
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;