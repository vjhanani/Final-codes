const { Op } = require("sequelize");
const Student = require("../models/Student");
const ExtraPurchase = require("../models/ExtraPurchase");
const ExtraItem = require("../models/ExtraItem");
const { sendMail } = require("./mailer");

exports.sendMonthlyExtrasReport = async () => {
  try {
    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all ACTIVE students
    const students = await Student.findAll({
      where: { status: "Approved" },
    });

    for (const student of students) {
      // Fetch purchases for this month
      const purchases = await ExtraPurchase.findAll({
        where: {
          StudentRollNo: student.rollNo,
          purchaseDate: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
        include: [
          {
            model: ExtraItem,
            attributes: ["name"],
          },
        ],
      });

      if (purchases.length === 0) continue;

      // Calculate total
      let total = 0;
      let rows = "";

      purchases.forEach((p) => {
        total += parseFloat(p.totalPrice);

        rows += `
          <tr>
            <td>${p.ExtraItem.name}</td>
            <td>${p.quantity}</td>
            <td>₹${p.totalPrice}</td>
            <td>${new Date(p.purchaseDate).toLocaleDateString()}</td>
          </tr>
        `;
      });

      // Email HTML
      const html = `
        <h2>Monthly Extras Report</h2>
        <p>Hello ${student.name},</p>
        <p>Here is your extras usage for this month:</p>

        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
          ${rows}
        </table>

        <h3>Total Extras Amount: ₹${total.toFixed(2)}</h3>

        <p>Regards,<br>Mess Management</p>
      `;

      // Send email
      await sendMail(student.email, "Monthly Extras Report", html);
    }

    console.log("Monthly emails sent successfully ✅");

  } catch (err) {
    console.error("Error sending monthly reports:", err);
  }
};