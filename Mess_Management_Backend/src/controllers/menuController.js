// controllers/menuController.js

const Menu = require("../models/Menu");
const sequelize = require("../config/db");

exports.setWeeklyMenu = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { weekMenu } = req.body;

    /*
    weekMenu format:

    {
      "Monday": {
        "Breakfast": ["Poha","Tea"],
        "Lunch": ["Rice","Dal"],
        "Dinner": ["Roti","Paneer"]
      },
      ...
    }
    */

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
