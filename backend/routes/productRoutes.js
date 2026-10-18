const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Route Seller
router.post(
	"/",
	verifyToken,
	verifyRole(["Seller"]),
	upload.single("image"),
	productController.createProduct,
);
router.get(
	"/seller",
	verifyToken,
	verifyRole(["Seller"]),
	productController.getSellerProducts,
);

// Route Customer (Semua user yang login bisa melihat produk sale yang sudah di-ACC)
router.get("/approved", verifyToken, productController.getApprovedProducts);

// Route Validator (Khusus Validator)
router.get(
	"/pending",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	productController.getPendingProducts,
);
router.put(
	"/:id/validate",
	verifyToken,
	verifyRole(["Validator", "Admin"]),
	productController.validateProduct,
);

router.get("/history", verifyToken, productController.getProductsHistory);

module.exports = router;
