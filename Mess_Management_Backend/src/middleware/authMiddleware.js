// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const MessManager = require("../models/MessManager");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // 🔐 get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ❌ no token
    if (!token) {
      return res.status(401).json({
        error: "Not authorized, token missing"
      });
    }

    // 🔐 verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👤 attach user
    if (decoded.role === "student") {
      const user = await Student.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.messCardStatus === "Suspended") {
        return res.status(403).json({ error: "Your account is currently suspended from accessing mess facilities." });
      }

      req.user = user;
      req.userRole = "student";
      req.user.role = "student"; 
    } else {
      const user = await MessManager.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "Manager not found" });
      }

      req.user = user;
      req.userRole = "manager";
      req.user.role = "manager";
    }

    next();

  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};