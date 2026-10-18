const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); // Import multer


// Route Customer
router.post(
	"/buy",
	verifyToken,
	verifyRole(["Customer"]),
	saleController.buyProduct,
);

// Route Seller
router.get(
	"/seller",
	verifyToken,
	verifyRole(["Seller"]),
	saleController.getSellerSales,
);
router.post(
	"/:id/upload-photo",
	verifyToken,
	upload.single("pickup_photo"),
	saleController.uploadPickupPhoto,
);

// Route Validator (Khusus memvalidasi pemindahan dana)
router.get(
	"/pending",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	saleController.getPendingSales,
);
router.put(
	"/:id/validate",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	saleController.validateSale,
);
// Tambahkan baris ini untuk riwayat customer
router.get(
	"/customer",
	verifyToken,
	verifyRole(["Customer"]),
	saleController.getCustomerSales,
);
router.get(
	"/receipt/:receipt_code",
	verifyToken,
	saleController.getSaleByReceipt,
);

router.get("/history", verifyToken, saleController.getSalesHistory);
module.exports = router;
