// utils/mailer.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// send OTP email
exports.sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Mess Automation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "OTP Verification - Mess System",
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Mess Automation" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };