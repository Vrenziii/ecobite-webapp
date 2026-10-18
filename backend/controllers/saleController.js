const pool = require("../config/db");

exports.buyProduct = async (req, res) => {
	const customer_id = req.user.id;
	const { product_id, qty } = req.body;

	// Gunakan koneksi dari pool untuk menjalankan transaksi DB (Rollback jika salah satu gagal)
	const connection = await pool.getConnection();
	await connection.beginTransaction();

	try {
		// 1. Cek Produk & Stok
		const [products] = await connection.query(
			"SELECT * FROM products WHERE id = ?",
			[product_id],
		);
		if (products.length === 0) throw new Error("Produk tidak ditemukan");

		const product = products[0];
		if (product.stock < qty) throw new Error("Stok produk tidak mencukupi");

		const total_price = product.discount_price * qty;

		// 2. Cek Saldo Wallet Customer
		const [wallets] = await connection.query(
			"SELECT * FROM wallets WHERE user_id = ?",
			[customer_id],
		);
		const wallet = wallets[0];
		if (!wallet || wallet.balance < total_price)
			throw new Error("Saldo Wallet tidak mencukupi. Silakan Top Up.");

		// 3. Potong Saldo Customer
		await connection.query(
			"UPDATE wallets SET balance = balance - ? WHERE id = ?",
			[total_price, wallet.id],
		);

		// 4. Catat Pemotongan di Riwayat Wallet
		await connection.query(
			'INSERT INTO wallet_transactions (wallet_id, type, amount, status, reference_id) VALUES (?, "Payment_Sale", ?, "Success", ?)',
			[wallet.id, total_price, `PAY-${product_id}-${Date.now()}`],
		);

		// 5. Kurangi Stok Produk
		await connection.query(
			"UPDATE products SET stock = stock - ? WHERE id = ?",
			[qty, product_id],
		);

		// 6. Buat Data Transaksi Ecobite Sale
		const receipt_code = `ECO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
		await connection.query(
			'INSERT INTO ecobite_sales (customer_id, seller_id, product_id, qty, total_price, receipt_code, status) VALUES (?, ?, ?, ?, ?, ?, "Paid")',
			[
				customer_id,
				product.seller_id,
				product_id,
				qty,
				total_price,
				receipt_code,
			],
		);

		// Commit semua perubahan jika berhasil
		await connection.commit();
		res.json({ message: "Pembelian berhasil!", receipt_code });
	} catch (error) {
		// Batalkan semua perubahan database jika ada yang error (Rollback)
		await connection.rollback();
		res.status(400).json({ message: error.message });
	} finally {
		connection.release();
	}
};

// [SELLER] Ambil daftar penjualan milik Seller
exports.getSellerSales = async (req, res) => {
	const seller_id = req.user.id;
	try {
		const [sales] = await pool.query(
			`
            SELECT es.*, p.name AS product_name, c.name AS customer_name 
            FROM ecobite_sales es 
            JOIN products p ON es.product_id = p.id 
            JOIN users c ON es.customer_id = c.id 
            WHERE es.seller_id = ?
            ORDER BY es.created_at DESC
        `,
			[seller_id],
		);
		res.json(sales);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [SELLER] Unggah foto bukti pengambilan barang
exports.uploadPickupPhoto = async (req, res) => {
	const sale_id = req.params.id;
	const seller_id = req.user.id;
	const pickup_photo = req.file ? `/uploads/${req.file.filename}` : null;

	if (!pickup_photo) {
		return res.status(400).json({ message: "Foto bukti wajib diunggah!" });
	}

	try {
		// Pastikan transaksi ini milik seller tersebut dan statusnya masih 'Paid'
		const [sale] = await pool.query(
			"SELECT status FROM ecobite_sales WHERE id = ? AND seller_id = ?",
			[sale_id, seller_id],
		);

		if (sale.length === 0)
			return res.status(404).json({ message: "Transaksi tidak ditemukan." });
		if (sale[0].status !== "Paid")
			return res
				.status(400)
				.json({ message: "Status transaksi tidak valid untuk aksi ini." });

		// Update foto dan ubah status ke Waiting_Validation
		await pool.query(
			'UPDATE ecobite_sales SET pickup_photo = ?, status = "Waiting_Validation" WHERE id = ?',
			[pickup_photo, sale_id],
		);

		res.json({
			message: "Bukti pengambilan berhasil diunggah! Menunggu validasi.",
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [VALIDATOR] Ambil daftar penjualan yang menunggu validasi dana
exports.getPendingSales = async (req, res) => {
	try {
		const [sales] = await pool.query(`
            SELECT es.*, p.name AS product_name, s.name AS seller_name, c.name AS customer_name
            FROM ecobite_sales es 
            LEFT JOIN products p ON es.product_id = p.id 
            LEFT JOIN users s ON es.seller_id = s.id 
            LEFT JOIN users c ON es.customer_id = c.id
            WHERE es.status = 'Waiting_Validation'
        `);
		res.json(sales);
	} catch (error) {
		// Ini biar error aslinya muncul di terminal backend!
		console.error("ERROR PENDING SALES:", error.message);
		res.status(500).json({ error: error.message });
	}
};

// [VALIDATOR] Validasi foto dan pindahkan dana ke Seller
exports.validateSale = async (req, res) => {
	const sale_id = req.params.id;
	const validator_id = req.user.id;

	const connection = await pool.getConnection();
	await connection.beginTransaction();

	try {
		// 1. Cek data transaksi
		const [sales] = await connection.query(
			'SELECT * FROM ecobite_sales WHERE id = ? AND status = "Waiting_Validation"',
			[sale_id],
		);
		if (sales.length === 0)
			throw new Error("Transaksi tidak ditemukan atau status tidak valid.");

		const sale = sales[0];

		// 2. Ubah status transaksi menjadi Completed
		await connection.query(
			'UPDATE ecobite_sales SET status = "Completed", validator_id = ? WHERE id = ?',
			[validator_id, sale_id],
		);

		// 3. Tambah saldo ke Wallet Seller
		const [sellerWallets] = await connection.query(
			"SELECT id FROM wallets WHERE user_id = ?",
			[sale.seller_id],
		);
		if (sellerWallets.length === 0)
			throw new Error("Wallet Seller tidak ditemukan.");
		const sellerWalletId = sellerWallets[0].id;

		await connection.query(
			"UPDATE wallets SET balance = balance + ? WHERE id = ?",
			[sale.total_price, sellerWalletId],
		);

		// 4. Catat riwayat pemasukan di wallet Seller
		await connection.query(
			'INSERT INTO wallet_transactions (wallet_id, type, amount, status, reference_id) VALUES (?, "Revenue_Sale", ?, "Success", ?)',
			[sellerWalletId, sale.total_price, sale.receipt_code],
		);

		await connection.commit();
		res.json({
			message: "Validasi berhasil! Dana telah diteruskan ke Seller.",
		});
	} catch (error) {
		await connection.rollback();
		res.status(400).json({ message: error.message });
	} finally {
		connection.release();
	}
};

// [CUSTOMER] Ambil daftar riwayat pembelian
exports.getCustomerSales = async (req, res) => {
	const customer_id = req.user.id;
	try {
		const [sales] = await pool.query(
			`
            SELECT es.*, p.name AS product_name, s.name AS seller_name 
            FROM ecobite_sales es 
            JOIN products p ON es.product_id = p.id 
            JOIN users s ON es.seller_id = s.id 
            WHERE es.customer_id = ?
            ORDER BY es.created_at DESC
        `,
			[customer_id],
		);
		res.json(sales);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [SELLER] Cari detail transaksi berdasarkan Kode Struk
exports.getSaleByReceipt = async (req, res) => {
	const { receipt_code } = req.params;
	const seller_id = req.user.id;
	try {
		const [sales] = await pool.query(
			`
            SELECT es.*, p.name AS product_name, p.image_url AS product_image, c.name AS customer_name 
            FROM ecobite_sales es
            JOIN products p ON es.product_id = p.id
            JOIN users c ON es.customer_id = c.id
            WHERE es.receipt_code = ? AND es.seller_id = ?
        `,
			[receipt_code.trim(), seller_id],
		);

		if (sales.length === 0) {
			return res
				.status(404)
				.json({
					message: "Kode Struk tidak ditemukan atau bukan milik toko Anda.",
				});
		}

		res.json(sales[0]);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// [VALIDATOR] Ambil riwayat penjualan yang sudah Selesai (Completed)
exports.getSalesHistory = async (req, res) => {
    try {
        const [sales] = await pool.query(`
            SELECT es.*, p.name AS product_name, s.name AS seller_name, c.name AS customer_name
            FROM ecobite_sales es 
            LEFT JOIN products p ON es.product_id = p.id 
            LEFT JOIN users s ON es.seller_id = s.id 
            LEFT JOIN users c ON es.customer_id = c.id
            WHERE es.status = 'Completed'
            ORDER BY es.created_at DESC
        `);
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};