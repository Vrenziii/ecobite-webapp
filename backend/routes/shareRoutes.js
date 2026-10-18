const express = require("express");
const router = express.Router();
const shareController = require("../controllers/shareController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Endpoint Customer
router.post(
	"/",
	verifyToken,
	verifyRole(["Customer"]),
	upload.single("image"),
	shareController.createShare,
);
router.get(
	"/my-history",
	verifyToken,
	verifyRole(["Customer"]),
	shareController.getMyShares,
);

// Endpoint Validator
router.get(
	"/pending",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	shareController.getPendingShares,
);
router.put(
	"/:id/validate",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	shareController.validateShare,
);
router.post(
	"/:id/complete",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	upload.single("pickup_photo"),
	shareController.completeShare,
);
router.get("/history", verifyToken, shareController.getSharesHistory);

module.exports = router;
