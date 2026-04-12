const { Student, Rebate, Poll, PreBooking, Feedback, Announcement } = require("../models/Index");
const { Op } = require("sequelize");

exports.getManagerStats = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Only manager allowed" });
    }

    const totalStudents = await Student.count({ where: { status: "Approved" } });
    const pendingRebates = await Rebate.count({ where: { status: "Pending" } });
    const activePolls = await Poll.count({ where: { status: "active" } });
    const newPersonRequests = await Student.count({ where: { status: "Pending" } });
    
    // Today's Pre-bookings
    const today = new Date().toISOString().split('T')[0];
    const todaysPrebookings = await PreBooking.count({ where: { date: today } });

    // Recent Activities
    const recentRebates = await Rebate.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Student, attributes: ['name', 'rollNo'] }]
    });

    const recentFeedbacks = await Feedback.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Student, attributes: ['name', 'rollNo'] }]
    });

    const recentStudents = await Student.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      where: { status: 'Pending' }
    });

    const recentPolls = await Poll.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const recentAnnouncements = await Announcement.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const activities = [
      ...recentRebates.map(r => ({
        time: r.createdAt,
        text: `New rebate request from ${r.Student?.name || 'Student'} (#${r.Student?.rollNo || 'N/A'})`,
        type: 'rebate'
      })),
      ...recentFeedbacks.map(f => ({
        time: f.createdAt,
        text: `New ${f.category} feedback received`,
        type: 'feedback'
      })),
      ...recentStudents.map(s => ({
        time: s.createdAt,
        text: `New registration request from ${s.name} (#${s.rollNo})`,
        type: 'student'
      })),
      ...recentPolls.map(p => ({
        time: p.createdAt,
        text: `New poll created: ${p.title}`,
        type: 'poll'
      })),
      ...recentAnnouncements.map(a => ({
        time: a.createdAt,
        text: `New announcement: ${a.title}`,
        type: 'announcement'
      }))
    ];

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      totalStudents,
      pendingRebates,
      activePolls,
      newPersonRequests,
      todaysPrebookings,
      recentActivities: activities.slice(0, 10)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
