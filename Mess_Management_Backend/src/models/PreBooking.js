// models/PreBooking.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PreBooking = sequelize.define("PreBooking", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dishName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  meal: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'),
    defaultValue: 'Pending',
  }
}, { timestamps: true });

module.exports = PreBooking;
