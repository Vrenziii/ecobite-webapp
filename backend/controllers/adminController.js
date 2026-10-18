const pool = require("../config/db");

// [ADMIN] Ambil semua user + saldo dari tabel wallets
exports.getAllUsers = async (req, res) => {
	try {
		const [users] = await pool.query(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at, 
                COALESCE(w.balance, 0) AS wallet_balance
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            ORDER BY u.created_at DESC
        `);
		res.json(users);
	} catch (error) {
		console.error("ERROR GET ALL USERS ADMIN:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// [ADMIN] Ubah role pengguna
exports.updateUserRole = async (req, res) => {
	const userId = req.params.id;
	const { role } = req.body;

	try {
		if (parseInt(userId) === req.user.id) {
			return res
				.status(400)
				.json({ message: "Anda tidak dapat mengubah role akun Anda sendiri." });
		}

		await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
		res.json({ message: `Role pengguna berhasil diubah menjadi ${role}` });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [ADMIN] Ambil SEMUA transaksi Sale
exports.getAllSales = async (req, res) => {
	try {
		const [sales] = await pool.query(`
            SELECT es.*, p.name AS product_name, s.name AS seller_name, c.name AS customer_name 
            FROM ecobite_sales es 
            LEFT JOIN products p ON es.product_id = p.id 
            LEFT JOIN users s ON es.seller_id = s.id 
            LEFT JOIN users c ON es.customer_id = c.id
            ORDER BY es.created_at DESC
        `);
		res.json(sales);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [ADMIN] Ambil SEMUA donasi Share
exports.getAllShares = async (req, res) => {
	try {
		const [shares] = await pool.query(`
            SELECT es.*, u.name AS customer_name 
            FROM ecobite_shares es 
            LEFT JOIN users u ON es.customer_id = u.id 
            ORDER BY es.created_at DESC
        `);
		res.json(shares);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
