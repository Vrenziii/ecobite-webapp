const pool = require("../config/db");
const snap = require("../config/midtrans");


// Ambil saldo wallet user yang sedang login
exports.getBalance = async (req, res) => {
	const userId = req.user.id;

	try {
		const [wallet] = await pool.query(
			"SELECT balance FROM wallets WHERE user_id = ?",
			[userId],
		);

		// JIKA WALLET TIDAK DITEMUKAN (Fix Error 404)
		if (wallet.length === 0) {
			// Otomatis buatkan dompet baru bersaldo 0
			await pool.query(
				"INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
				[userId],
			);
			return res.json({ balance: 0 });
		}

		res.json({ balance: wallet[0].balance });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};


// [BARU] Ajukan Top Up untuk mendapatkan Snap Token
exports.topup = async (req, res) => {
	const { amount } = req.body;
	const userId = req.user.id;

	try {
		// Ambil data user untuk Midtrans
		const [users] = await pool.query(
			"SELECT name, email, phone FROM users WHERE id = ?",
			[userId],
		);
		const user = users[0];

		// Ambil wallet_id
		const [wallets] = await pool.query(
			"SELECT id FROM wallets WHERE user_id = ?",
			[userId],
		);
		const walletId = wallets[0].id;

		// Buat Order ID unik
		const orderId = `TOPUP-${userId}-${Date.now()}`;

		// Simpan transaksi awal dengan status 'Pending'
		// Ingat di ERD kita punya tipe transaksi
		await pool.query(
			'INSERT INTO wallet_transactions (wallet_id, type, amount, status, reference_id) VALUES (?, "Deposit", ?, "Pending", ?)',
			[walletId, amount, orderId],
		);

		// Parameter untuk Midtrans
		let parameter = {
			transaction_details: {
				order_id: orderId,
				gross_amount: amount,
			},
			customer_details: {
				first_name: user.name,
				email: user.email,
				phone: user.phone || "08123456789",
			},
		};

		const transaction = await snap.createTransaction(parameter);

		// Kembalikan token ke frontend untuk memunculkan pop-up
		res.json({ token: transaction.token, orderId: orderId });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [BARU] Verifikasi Pembayaran (Karena kita pakai Localhost, webhook midtrans tidak bisa masuk, jadi kita cek manual dari frontend)
exports.verifyTopup = async (req, res) => {
	const { orderId } = req.body;

	try {
		// Cek status dari API Midtrans langsung
		const statusResponse = await snap.transaction.status(orderId);

		let transactionStatus = statusResponse.transaction_status;
		let fraudStatus = statusResponse.fraud_status;
		let dbStatus = "Pending";

		if (transactionStatus == "capture" || transactionStatus == "settlement") {
			if (fraudStatus == "accept") {
				dbStatus = "Success";
			}
		} else if (
			transactionStatus == "cancel" ||
			transactionStatus == "deny" ||
			transactionStatus == "expire"
		) {
			dbStatus = "Failed";
		}

		// Cek status di DB agar tidak di-update / ditambah 2 kali
		const [tx] = await pool.query(
			"SELECT status, amount, wallet_id FROM wallet_transactions WHERE reference_id = ?",
			[orderId],
		);

		if (tx.length === 0)
			return res.status(404).json({ message: "Transaksi tidak ditemukan" });

		if (tx[0].status === "Pending" && dbStatus === "Success") {
			// 1. Update status transaksi
			await pool.query(
				'UPDATE wallet_transactions SET status = "Success" WHERE reference_id = ?',
				[orderId],
			);
			// 2. Tambah saldo ke wallet
			await pool.query(
				"UPDATE wallets SET balance = balance + ? WHERE id = ?",
				[tx[0].amount, tx[0].wallet_id],
			);

			return res.json({ message: "Top up berhasil, saldo bertambah!" });
		}

		res.json({ message: `Status transaksi saat ini: ${dbStatus}` });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
