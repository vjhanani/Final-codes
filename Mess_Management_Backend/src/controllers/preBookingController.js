// controllers/preBookingController.js
const { PreBooking, Student } = require("../models/Index");

exports.bookItem = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const { dishName, meal, date, SpecialItemId } = req.body;
    if (!dishName || !meal || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const targetDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(currentDate);
    maxDate.setDate(maxDate.getDate() + 7);

    if (targetDate < currentDate) {
      return res.status(400).json({ error: "Cannot book items for past dates" });
    }

    if (targetDate > maxDate) {
      return res.status(400).json({ error: "Pre-booking is restricted to a maximum of 7 days in advance" });
    }

    const booking = await PreBooking.create({
      StudentRollNo: req.user.rollNo,
      dishName,
      meal,
      date,
      SpecialItemId,
      status: "Pending"
    });

    res.json({ message: "Item pre-booked successfully", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await PreBooking.findAll({
      where: { StudentRollNo: req.user.rollNo },
      order: [["date", "DESC"]]
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }
    const bookings = await PreBooking.findAll({
      include: [{ model: Student }],
      order: [["date", "DESC"]]
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateBookingStatus = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const booking = await PreBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json({ message: `Booking ${status}`, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
