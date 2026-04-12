const { SpecialItem } = require("../models/Index");

exports.createSpecialItem = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { name, price, meal, date } = req.body;

    if (!name || price === undefined || price === null || !meal || !date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: "Price must be a valid number greater than or equal to 0" });
    }

    const targetDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(currentDate);
    maxDate.setDate(maxDate.getDate() + 7);

    if (targetDate < currentDate) {
      return res.status(400).json({ error: "Cannot create items for past dates" });
    }

    if (targetDate > maxDate) {
      return res.status(400).json({ error: "Cannot create items more than 7 days in advance" });
    }

    const item = await SpecialItem.create({ name, price, meal, date });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableItems = async (req, res) => {
  try {
    const items = await SpecialItem.findAll({
      where: { isAvailable: true }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSpecialItem = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const item = await SpecialItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await item.destroy();
    res.json({ message: "Special item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleAvailability = async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ error: "Only manager allowed" });
      }
  
      const item = await SpecialItem.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: "Item not found" });
  
      item.isAvailable = !item.isAvailable;
      await item.save();
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
