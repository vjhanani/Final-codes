const cron = require("node-cron");
const { sendMonthlyExtrasReport } = require("./monthlyReportService");

// Run at 11:59 PM on last day of month
cron.schedule("59 23 28-31 * *", async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Check if tomorrow is next month (means today is last day)
  if (tomorrow.getMonth() !== today.getMonth()) {
    console.log("Running monthly extras email job...");
    await sendMonthlyExtrasReport();
  }
});