const pool = require("../config/db");

// Tambah Produk
exports.createProduct = async (req, res) => {
	const { name, description, original_price, discount_price, stock } = req.body;
	const seller_id = req.user.id; // Didapat dari verifyToken middleware

	// Ambil path gambar jika file berhasil diunggah
	const image_url = req.file ? `/uploads/${req.file.filename}` : null;

	try {
		const [result] = await pool.query(
			"INSERT INTO products (seller_id, name, description, original_price, discount_price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
			[
				seller_id,
				name,
				description,
				original_price,
				discount_price,
				stock,
				image_url,
			],
		);
		res.status(201).json({
			message: "Produk berhasil ditambahkan!",
			productId: result.insertId,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Ambil Semua Produk Milik Seller yang Sedang Login
exports.getSellerProducts = async (req, res) => {
	const seller_id = req.user.id;
	try {
		const [products] = await pool.query(
			"SELECT * FROM products WHERE seller_id = ?",
			[seller_id],
		);
		res.json(products);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [CUSTOMER] Ambil Semua Produk yang Sudah di-ACC (Approved)
exports.getApprovedProducts = async (req, res) => {
    try {
        const [products] = await pool.query(
            "SELECT p.*, u.name AS seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.validation_status = 'Approved' AND p.is_active = TRUE"
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// [VALIDATOR] Ambil Semua Produk yang Berstatus 'Pending'
exports.getPendingProducts = async (req, res) => {
    try {
        const [products] = await pool.query(
					"SELECT p.*, u.name AS seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.validation_status = 'Pending' ORDER BY p.id DESC",
				);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// [VALIDATOR] Ubah Status Validasi Produk
exports.validateProduct = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' atau 'Rejected'

    try {
        await pool.query('UPDATE products SET validation_status = ? WHERE id = ?', [status, id]);
        res.json({ message: `Produk berhasil di-${status.toLowerCase()}!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// [VALIDATOR] Ambil Riwayat Produk yang sudah Approved / Rejected
exports.getProductsHistory = async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.*, u.name AS seller_name 
            FROM products p
            LEFT JOIN users u ON p.seller_id = u.id
            WHERE p.validation_status IN ('Approved', 'Rejected')
            ORDER BY p.id DESC
        `);
        res.json(products);
    } catch (error) {
        console.error("ERROR GET PRODUCTS HISTORY:", error.message);
        res.status(500).json({ error: error.message });
    }
};
