const midtransClient = require("midtrans-client");
require("dotenv").config();

// Buat instance Snap Midtrans
let snap = new midtransClient.Snap({
	isProduction: false, // Gunakan false untuk mode Sandbox
	serverKey: process.env.MIDTRANS_SERVER_KEY,
	clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = snap;
