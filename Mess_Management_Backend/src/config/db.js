// config/db.js

const { Sequelize } = require("sequelize");

if (!process.env.DB_URL) {
  console.error("❌ CRITICAL ERROR: DB_URL is not defined in .env file");
}

const isLocalhost = process.env.DB_URL && (process.env.DB_URL.includes("localhost") || process.env.DB_URL.includes("127.0.0.1"));

const sequelize = new Sequelize(process.env.DB_URL || "", {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  dialectOptions: {
    ...(isLocalhost ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }),
  },
});

module.exports = sequelize;