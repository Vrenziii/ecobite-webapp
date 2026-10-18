const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
	// Ambil token dari header Authorization (Bearer <token>)
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token)
		return res
			.status(403)
			.json({ message: "Akses ditolak, token tidak ditemukan!" });

	try {
		const decoded = jwt.verify(token, "ecobite_secret"); // Gunakan secret yang sama saat login
		req.user = decoded; // Simpan data user (id, role) ke request
		next(); // Lanjut ke proses berikutnya
	} catch (error) {
		res.status(401).json({ message: "Token tidak valid!" });
	}
};

// Middleware khusus untuk mengecek Role tertentu (misal: hanya Seller)
const verifyRole = (roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res
				.status(403)
				.json({ message: `Akses ditolak, khusus role: ${roles.join(", ")}` });
		}
		next();
	};
};

module.exports = { verifyToken, verifyRole };
