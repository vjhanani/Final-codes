const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Feedback = sequelize.define('Feedback', {
    rating: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 5 },
        allowNull: false
    },
    comment: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.ENUM('Food Quality', 'Cleanliness', 'Service', 'Other'),
        defaultValue: 'Food Quality'
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'resolved'),
        defaultValue: 'pending'
    },
    response: {
        type: DataTypes.TEXT
    }
}, { timestamps: true });

module.exports = Feedback;