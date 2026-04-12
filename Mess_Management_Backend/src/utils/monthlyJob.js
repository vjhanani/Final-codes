const cron = require("node-cron");
const { sendMonthlyExtrasReport } = require("./monthlyReportService");

// Run at 11:59 PM on last day of month
cron.schedule("59 23 28-31 * *", async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Check if tomorrow is next month (means today is last day)
  if (tomorrow.getMonth() !== today.getMonth()) {
    console.log("Running monthly cleanup jobs...");
    await sendMonthlyExtrasReport();

    // Clear all poll data for the new month
    try {
      const { Poll, PollOption, Vote } = require("../models/Index");
      await Vote.destroy({ where: {}, truncate: false });
      await PollOption.destroy({ where: {}, truncate: false });
      await Poll.destroy({ where: {}, truncate: false });
      console.log("🧹 Monthly Poll Cleanup: All polls, options, and votes have been cleared.");
    } catch (err) {
      console.error("❌ Error during monthly poll cleanup:", err);
    }
  }
});

// Expiration Job: Run Every Hour
// Deletes PreBooking requests that were created more than 24 hours ago
const { PreBooking } = require("../models/Index");
const { Op } = require("sequelize");

cron.schedule("0 * * * *", async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deletedCount = await PreBooking.destroy({
      where: {
        createdAt: {
          [Op.lt]: twentyFourHoursAgo
        }
      }
    });
    if (deletedCount > 0) {
      console.log(`🧹 Expired ${deletedCount} pre-booking requests (older than 24hrs).`);
    }
  } catch (err) {
    console.error("❌ Error in pre-booking expiration job:", err);
  }
});