require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const path = require("path");
const walletRoutes = require("./routes/walletRoutes");
const saleRoutes = require("./routes/saleRoutes");
const shareRoutes = require("./routes/shareRoutes");
const adminRoutes = require('./routes/adminRoutes'); // Tambahkan di atas

// Gunakan Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api/wallet", walletRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/shares", shareRoutes);
app.use('/api/admin', adminRoutes); 


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Ecobite Backend berjalan di http://localhost:${PORT}`);
});

// Tambahkan ini di server.js
app.use((req, res, next) => {
    console.log(`[REQUEST MASUK] ${req.method} ${req.url}`);
    next();
});