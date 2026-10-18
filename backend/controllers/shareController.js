const pool = require("../config/db");

// [CUSTOMER] Buat ajuan donasi baru (Status awal: Pending)
// [VALIDATOR] Lihat riwayat donasi (Approved, Completed, Taken, Rejected)
exports.getSharesHistory = async (req, res) => {
	try {
		const [shares] = await pool.query(`
            SELECT es.*, u.name AS customer_name, v.name AS validator_name
            FROM ecobite_shares es
            LEFT JOIN users u ON es.customer_id = u.id
            LEFT JOIN users v ON es.validator_id = v.id
            WHERE es.status IN ('Completed', 'Taken', 'Rejected')
            ORDER BY es.created_at DESC
        `);
		res.json(shares);
	} catch (error) {
		console.error("ERROR GET SHARES HISTORY:", error.message);
		res.status(500).json({ error: error.message });
	}
};
exports.createShare = async (req, res) => {
	const { item_name, description } = req.body;
	const customer_id = req.user.id;
	const food_photo = req.file ? `/uploads/${req.file.filename}` : null;

	// Receipt code disiapkan, tapi baru valid dipakai setelah Approved
	const receipt_code = `SHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

	if (!food_photo)
		return res.status(400).json({ message: "Foto makanan wajib diunggah" });

	try {
		await pool.query(
			'INSERT INTO ecobite_shares (customer_id, item_name, description, food_photo, receipt_code, status) VALUES (?, ?, ?, ?, ?, "Pending")',
			[customer_id, item_name, description, food_photo, receipt_code],
		);
		res.json({
			message:
				"Ajuan donasi terkirim! Menunggu pengecekan kelayakan oleh tim kami.",
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [CUSTOMER] Ambil riwayat donasinya sendiri
exports.getMyShares = async (req, res) => {
	const customer_id = req.user.id;
	try {
		const [shares] = await pool.query(
			"SELECT * FROM ecobite_shares WHERE customer_id = ? ORDER BY created_at DESC",
			[customer_id],
		);
		res.json(shares);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [VALIDATOR] Lihat daftar ajuan donasi masuk (Pending)
exports.getPendingShares = async (req, res) => {
	try {
		const [shares] = await pool.query(`
            SELECT es.*, u.name AS customer_name 
            FROM ecobite_shares es 
            JOIN users u ON es.customer_id = u.id 
            WHERE es.status IN ('Pending', 'Approved') 
            ORDER BY es.created_at ASC
        `);
		res.json(shares);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [VALIDATOR] ACC atau Tolak kelayakan donasi
exports.validateShare = async (req, res) => {
	const share_id = req.params.id;
	const { status } = req.body; // 'Approved' atau 'Rejected'
	const validator_id = req.user.id;

	try {
		if (status === "Approved") {
			// Set batas waktu 24 jam ke depan
			const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const receipt_code = `DON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

			await pool.query(
				"UPDATE ecobite_shares SET status = ?, validator_id = ?, pickup_deadline = ?, receipt_code = ? WHERE id = ?",
				[status, validator_id, deadline, receipt_code, share_id],
			);
		} else {
			await pool.query(
				"UPDATE ecobite_shares SET status = ?, validator_id = ? WHERE id = ?",
				[status, validator_id, share_id],
			);
		}
		res.json({ message: `Donasi berhasil di-${status.toLowerCase()}` });
	} catch (error) {
		console.error("ERROR VALIDATE SHARE:", error.message); // Biar kelacak jelas di terminal jika ada error
		res.status(500).json({ error: error.message });
	}
};

// [VALIDATOR] Tandai donasi sudah diterima secara fisik
// [VALIDATOR/PETUGAS] Selesaikan Donasi & Unggah Bukti Penyerahan Fisik
exports.completeShare = async (req, res) => {
	const share_id = req.params.id;
	const pickup_photo = req.file ? `/uploads/${req.file.filename}` : null;

	if (!pickup_photo) {
		return res
			.status(400)
			.json({ message: "Foto bukti pengambilan makanan wajib diunggah!" });
	}

	try {
		const [result] = await pool.query(
			`UPDATE ecobite_shares 
             SET status = 'Taken', pickup_photo = ? 
             WHERE id = ?`,
			[pickup_photo, share_id],
		);

		if (result.affectedRows === 0) {
			return res.status(404).json({ message: "Data donasi tidak ditemukan." });
		}

		res.json({
			message:
				"Bukti pengambilan berhasil diunggah! Donasi dinyatakan selesai.",
		});
	} catch (error) {
		console.error("ERROR COMPLETE SHARE:", error.message);
		res.status(500).json({ error: error.message });
	}
};
