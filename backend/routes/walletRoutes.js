const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { verifyToken } = require("../middleware/authMiddleware");

// Semua user yang login (terutama Customer dan Seller) bisa melihat saldo mereka
router.get("/balance", verifyToken, walletController.getBalance);
router.post('/topup', verifyToken, walletController.topup);
router.post('/verify', verifyToken, walletController.verifyTopup);


module.exports = router;
