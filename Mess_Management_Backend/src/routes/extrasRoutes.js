// routes/extrasRoutes.js

const express = require("express");
const router = express.Router();

const extrasController = require("../controllers/extrasController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// manager
router.post("/add", protect, allowRoles("manager"), extrasController.addExtraItem);
router.put("/update/:id", protect, allowRoles("manager"), extrasController.updateExtraItem);
router.delete("/delete/:id", protect, allowRoles("manager"), extrasController.deleteExtraItem);
router.get("/analytics", protect, allowRoles("manager"), extrasController.getExtrasAnalytics);
router.get("/purchases", protect, allowRoles("manager"), extrasController.getPurchaseHistory);

// student
router.post("/buy", protect, allowRoles("student"), extrasController.buyExtras);
router.get("/my", protect, allowRoles("student"), extrasController.getMyExtras);

// everyone
router.get("/", protect, extrasController.getAllExtras);

module.exports = router;