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
