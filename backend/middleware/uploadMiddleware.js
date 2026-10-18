const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "public/uploads/"); // Simpan ke folder public/uploads
	},
	filename: (req, file, cb) => {
		// Buat nama file unik: timestamp + ekstensi asli
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

// Filter hanya untuk gambar
const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Bukan file gambar!"), false);
	}
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
