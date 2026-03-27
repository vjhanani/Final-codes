// server.js

require("dotenv").config();
require("./utils/monthlyJob");

const app = require("./app");
const sequelize = require("./config/db");
require("./models/Index"); // Load all model associations

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB Connected");

    // Sync with alter: true to handle missing columns
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error(err);
  }
};

startServer();