// controllers/extrasController.js

const ExtraItem = require("../models/ExtraItem");
const ExtraPurchase = require("../models/ExtraPurchase");
const Student = require("../models/Student");
const Transaction = require("../models/Transaction");
const { Op } = require("sequelize");

const getCurrentMeal = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 17) return "Lunch";
  return "Dinner";
};

exports.addExtraItem = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    // Check if item with exact name already exists (case-insensitive)
    const existingItem = await ExtraItem.findOne({
      where: { name: { [Op.iLike]: req.body.name } }
    });

    if (existingItem) {
      return res.status(400).json({
        error: "An item with this exact name already exists in the inventory."
      });
    }

    const item = await ExtraItem.create(req.body);

    res.json({ message: "Item added", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateExtraItem = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const item = await ExtraItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await item.update(req.body);

    res.json({ message: "Item updated", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExtraItem = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    await ExtraItem.destroy({ where: { id: req.params.id } });

    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllExtras = async (req, res) => {
  try {
    const days = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];

    const today = days[new Date().getDay()];
    const currentMeal = getCurrentMeal();

    const userRole = req.userRole || (req.user && req.user.role);
    if (req.user && userRole === "manager") {
      const items = await ExtraItem.findAll();
      return res.json({
        day: today,
        mealType: currentMeal,
        items
      });
    }

    const items = await ExtraItem.findAll({
      where: { isAvailable: true }
    });

    res.json({
      day: today,
      mealType: currentMeal,
      items
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.buyExtras = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const studentId = req.user.rollNo;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items selected" });
    }

    const days = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];

    const today = days[new Date().getDay()];

    const getCurrentMeal = () => {
      const hour = new Date().getHours();
      if (hour < 11) return "Breakfast";
      if (hour < 17) return "Lunch";
      return "Dinner";
    };

    const currentMeal = getCurrentMeal();

    let totalAmount = 0;
    const purchases = [];

    const transaction = await ExtraItem.sequelize.transaction();

    try {
      for (const item of items) {
        const extra = await ExtraItem.findByPk(item.itemId, { transaction });

        if (!extra) {
          await transaction.rollback();
          return res.status(404).json({
            error: `Item not found`
          });
        }

        if (!extra.isAvailable) {
          await transaction.rollback();
          return res.status(400).json({
            error: `${extra.name} is not available`
          });
        }


        if (!item.quantity || item.quantity <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Invalid quantity for ${extra.name}`
          });
        }

        if (extra.stockQuantity < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Not enough stock for ${extra.name}`
          });
        }

        const price = parseFloat(extra.price) * item.quantity;

        extra.stockQuantity -= item.quantity;
        await extra.save({ transaction });

        const purchase = await ExtraPurchase.create({
          StudentRollNo: studentId,
          ExtraItemId: extra.id,
          quantity: item.quantity,
          totalPrice: price
        }, { transaction });

        await Transaction.create({
          StudentRollNo: studentId,
          itemName: extra.name,
          amount: price,
          type: 'extra',
          status: 'Completed',
          date: new Date()
        }, { transaction });

        totalAmount += price;

        purchases.push({
          itemName: extra.name,
          quantity: item.quantity,
          price: price
        });
      }

      await transaction.commit();

      res.json({
        message: "Purchase successful",
        day: today,
        mealType: currentMeal,
        totalAmount,
        purchases
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyExtras = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const purchases = await ExtraPurchase.findAll({
      where: { StudentRollNo: req.user.rollNo },
      include: [{ model: ExtraItem }]
    });

    let total = 0;

    purchases.forEach(p => {
      total += parseFloat(p.totalPrice);
    });

    res.json({
      totalAmount: total,
      history: purchases
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExtrasAnalytics = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { month, year } = req.query;
    let where = {};

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.purchaseDate = { [Op.between]: [startDate, endDate] };
    }

    const purchases = await ExtraPurchase.findAll({
      where,
      include: [ExtraItem]
    });

    let totalRevenue = 0;
    let itemStats = {};

    purchases.forEach(p => {
      totalRevenue += parseFloat(p.totalPrice);

      const name = p.ExtraItem.name;

      if (!itemStats[name]) {
        itemStats[name] = {
          quantity: 0,
          revenue: 0
        };
      }

      itemStats[name].quantity += p.quantity;
      itemStats[name].revenue += parseFloat(p.totalPrice);
    });

    res.json({
      totalRevenue,
      items: itemStats
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPurchaseHistory = async (req, res) => {
  try {
    const userRole = req.userRole || (req.user && req.user.role);
    if (userRole !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { month, year } = req.query;
    let where = {};

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.purchaseDate = { [Op.between]: [startDate, endDate] };
    }

    const purchases = await ExtraPurchase.findAll({
      where,
      include: [
        { model: ExtraItem, attributes: ["name", "price"] },
        { model: Student, attributes: ["rollNo", "name"] }
      ],
      order: [["purchaseDate", "DESC"]]
    });

    const history = purchases.map(p => ({
      id: p.id,
      studentRollNo: p.Student ? p.Student.rollNo : p.StudentRollNo,
      studentName: p.Student ? p.Student.name : "Unknown",
      purchaseDate: p.purchaseDate,
      itemName: p.ExtraItem ? p.ExtraItem.name : "Unknown",
      itemPrice: p.ExtraItem ? parseFloat(p.ExtraItem.price) : 0,
      quantity: p.quantity,
      totalAmount: parseFloat(p.totalPrice)
    }));

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
