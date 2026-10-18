const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

router.get(
	"/users",
	verifyToken,
	verifyRole(["Admin"]),
	adminController.getAllUsers,
);
router.put(
	"/users/:id/role",
	verifyToken,
	verifyRole(["Admin"]),
	adminController.updateUserRole,
);

// Tambahkan 2 rute baru ini untuk monitoring:
router.get(
	"/sales",
	verifyToken,
	verifyRole(["Admin"]),
	adminController.getAllSales,
);
router.get(
	"/shares",
	verifyToken,
	verifyRole(["Admin"]),
	adminController.getAllShares,
);

module.exports = router;
