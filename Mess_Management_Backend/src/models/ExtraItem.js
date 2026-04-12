const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ExtraItem = sequelize.define('ExtraItem', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        allowNull: false
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    mealType: {
        type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner', 'All'),
        allowNull: false
    },
    day: {
        type: DataTypes.ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All'),
        allowNull: false
    }
}, { timestamps: true });

module.exports = ExtraItem;