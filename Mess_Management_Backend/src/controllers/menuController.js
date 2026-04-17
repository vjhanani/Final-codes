// controllers/menuController.js

const Menu = require("../models/Menu");
const sequelize = require("../config/db");

const VALID_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const VALID_MEALS = ["Breakfast", "Lunch", "Dinner"];

/**
 * Validates a meals object for a single day.
 * Ensures all required meals are present and have at least one item.
 */
const validateDayMeals = (meals) => {
  if (!meals || typeof meals !== "object") {
    throw new Error("Meals data must be an object");
  }

  for (const mealType of VALID_MEALS) {
    if (!meals[mealType]) {
      throw new Error(`Missing meal type: ${mealType}`);
    }
    if (!Array.isArray(meals[mealType]) || meals[mealType].length === 0) {
      throw new Error(`Meal type ${mealType} must have at least one item`);
    }
  }

  // Check for invalid meal types
  for (const key in meals) {
    if (!VALID_MEALS.includes(key)) {
      throw new Error(`Invalid meal type: ${key}`);
    }
  }
};

exports.setWeeklyMenu = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { weekMenu } = req.body;

    // --- Validation ---
    if (!weekMenu || typeof weekMenu !== "object") {
      return res.status(400).json({ error: "weekMenu must be an object" });
    }

    try {
      for (const day of VALID_DAYS) {
        if (!weekMenu[day]) {
          throw new Error(`Missing menu for day: ${day}`);
        }
        validateDayMeals(weekMenu[day]);
      }
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    await sequelize.transaction(async (t) => {
      // delete old menu
      await Menu.destroy({ where: {}, transaction: t });

      const entries = [];

      for (const day in weekMenu) {
        for (const mealType in weekMenu[day]) {
          entries.push({
            day,
            mealType,
            items: weekMenu[day][mealType]
          });
        }
      }

      await Menu.bulkCreate(entries, { transaction: t });
    });

    res.json({ message: "Weekly menu set successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDayMenu = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { day } = req.params;
    const { meals } = req.body;

    // --- Validation ---
    if (!VALID_DAYS.includes(day)) {
      return res.status(400).json({ error: "Invalid day" });
    }

    try {
      validateDayMeals(meals);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    await sequelize.transaction(async (t) => {
      // delete that day
      await Menu.destroy({ where: { day }, transaction: t });

      const entries = [];

      for (const mealType in meals) {
        entries.push({
          day,
          mealType,
          items: meals[mealType]
        });
      }

      await Menu.bulkCreate(entries, { transaction: t });
    });

    res.json({ message: `${day} menu updated` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuSlot = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { day, mealType } = req.params;
    const { items } = req.body;

    const validDays = [
    "Sunday","Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday"
    ];

    const validMeals = ["Breakfast","Lunch","Dinner"];

    if (!validDays.includes(day)) {
    return res.status(400).json({ error: "Invalid day" });
    }

    if (!validMeals.includes(mealType)) {
    return res.status(400).json({ error: "Invalid meal type" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        error: "Items array required"
      });
    }

    // find existing slot
    let menu = await Menu.findOne({
      where: { day, mealType }
    });

    if (menu) {
      // update existing
      menu.items = items;
      await menu.save();

      return res.json({
        message: `${day} ${mealType} updated`,
        menu
      });
    } else {
      // create if not exists (safe fallback)
      menu = await Menu.create({
        day,
        mealType,
        items
      });

      return res.json({
        message: `${day} ${mealType} created`,
        menu
      });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWeeklyMenu = async (req, res) => {
  try {
    const menus = await Menu.findAll();

    const result = {};

    menus.forEach(m => {
      if (!result[m.day]) result[m.day] = {};

      result[m.day][m.mealType] = m.items;
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayMenu = async (req, res) => {
  try {
    const days = [
      "Sunday","Monday","Tuesday","Wednesday",
      "Thursday","Friday","Saturday"
    ];

    const today = days[new Date().getDay()];

    const menus = await Menu.findAll({
      where: { day: today }
    });

    const result = {};

    menus.forEach(m => {
      result[m.mealType] = m.items;
    });

    res.json({
      day: today,
      menu: result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
