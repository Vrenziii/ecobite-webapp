const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER USER
exports.register = async (req, res) => {
	const { name, email, password, role, phone, address } = req.body;

	try {
		// Cek apakah email sudah terdaftar
		const [existingUser] = await pool.query(
			"SELECT * FROM users WHERE email = ?",
			[email],
		);
		if (existingUser.length > 0) {
			return res.status(400).json({ message: "Email sudah terdaftar!" });
		}

		// Hash Password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Insert User
		const [result] = await pool.query(
			"INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
			[name, email, hashedPassword, role, phone, address],
		);

		const userId = result.insertId;

		// Otomatis buatkan Wallet jika role adalah Customer atau Seller
		if (role === "Customer" || role === "Seller") {
			await pool.query(
				"INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
				[userId],
			);
		}

		res.status(201).json({ message: "Registrasi berhasil!", userId });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// LOGIN USER
exports.login = async (req, res) => {
	const { email, password } = req.body;

	try {
		// Cari user berdasarkan email
		const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
			email,
		]);
		if (users.length === 0) {
			return res.status(404).json({ message: "Email tidak ditemukan!" });
		}

		const user = users[0];

		// Cek kesesuaian password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Password salah!" });
		}

		// Buat Token JWT (gunakan string rahasia sementara 'ecobite_secret')
		const token = jwt.sign({ id: user.id, role: user.role }, "ecobite_secret", {
			expiresIn: "1d",
		});

		res.json({
			message: "Login berhasil",
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
