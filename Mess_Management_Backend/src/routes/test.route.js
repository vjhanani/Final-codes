const express = require("express");
const router = express.Router();
const { sendMonthlyExtrasReport } = require("../utils/monthlyReportService");

router.get("/send-monthly", async (req, res) => {
  await sendMonthlyExtrasReport();
  res.json({ message: "Emails sent" });
});

module.exports = router;