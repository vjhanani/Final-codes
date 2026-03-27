const { Op } = require("sequelize");
const Rebate = require("./src/models/Rebate");

async function checkOverlap() {
  const startDate = "2026-04-29";
  const endDate = "2026-05-10";

  const overlap = await Rebate.findOne({
    where: {
      StudentRollNo: "210001", // Assuming rollNo exists
      startDate: {
        [Op.lte]: endDate
      },
      endDate: {
        [Op.gte]: startDate
      }
    }
  });

  console.log("Overlap found:", overlap ? overlap.toJSON() : null);
}

checkOverlap().catch(console.error);
