# Dokumentasi Proyek: Ecobite Web App

## 📌 Deskripsi Proyek
**Ecobite** adalah aplikasi web platform sosial dan komersial yang berfokus pada pengurangan pemborosan makanan (*food waste*). Platform ini memungkinkan pengguna (Customer) untuk membeli produk makanan dari restoran/penjual (Seller) dengan harga terjangkau (**Ecobite Sale**) serta mendonasikan bahan makanan layak konsumsi (**Ecobite Share**). Seluruh proses transaksi dan donasi diverifikasi oleh tim penilai (Validator) dan dikelola oleh Admin.

---

## 🚀 Tech Stack
* **Frontend:** Next.js
* **Backend:** Express.js
* **Database:** MySQL (menggunakan environment Laragon)
* **Payment Gateway:** Midtrans

---

## 👥 Peran Pengguna (User Roles)
Terdapat empat peran pengguna utama dalam aplikasi ini:
1. **Customer**: Pengguna yang dapat membeli produk makanan setengah harga, mendonasikan bahan makanan, dan mengelola saldo *wallet*.
2. **Seller**: Penjual/restoran yang mendaftarkan dan menjual produk makanan serta mengunggah bukti pengambilan pesanan.
3. **Validator**: Pihak penilai yang meninjau kelayakan donasi, mengonfirmasi bukti pengambilan barang, serta memverifikasi pembayaran/pemindahan dana.
4. **Admin**: Pengelola utama sistem yang menangani manajemen pengguna (CRUD), seluruh transaksi penjualan, dan donasi.

---

## 💻 Hak Akses & Modul Dashboard

### 1. Modul Autentikasi
* **Register**: Dapat dilakukan oleh peran *Customer* dan *Seller*.
* **Login**: Tersedia untuk semua peran dengan fitur **Auto Redirect** ke dashboard masing-masing peran.
* **Logout**: Tersedia untuk semua peran.

### 2. Dashboard Customer
* **Penjelasan Web Ecobite**: Informasi mengenai platform dan misi Ecobite.
* **Ecobite Sale**: Menjelajahi dan membeli produk dari seller/restoran mitra.
* **Ecobite Share**: Mengajukan donasi bahan makanan yang masih layak konsumsi.
* **Riwayat Aktivitas**: Mengelola riwayat transaksi *Ecobite Sale* dan *Ecobite Share*.
* **Pengaturan Profil**: Mengelola data diri customer.

### 3. Dashboard Seller
* **Manajemen Produk (CRUD)**: Menambah, mengubah, atau menghapus produk makanan di akun masing-masing.
* **Manajemen Penjualan**: Memantau dan mengelola status penjualan produk (*Ecobite Sale*).
* **Unggah Bukti Pengambilan**: Mengunggah foto bukti bahwa produk telah diambil oleh customer.
* **Pengaturan Profil**: Mengelola data profil seller.

### 4. Dashboard Validator
* **Validasi Donasi (Ecobite Share)**: Memeriksa dan memvalidasi foto kelayakan bahan makanan yang didonasikan.
* **Riwayat Validasi**: Menampilkan riwayat bahan makanan yang disetujui (ACC) atau ditolak per ID Validator.
* **Validasi Pembayaran**: Memvalidasi transaksi sebelum dana di *wallet* ditransfer dari Customer ke Seller.
* **Pembaruan Status Donasi**: Mengubah status donasi ketika barang telah selesai diambil oleh pihak penyedia aplikasi.
* **Validasi Pengambilan (Ecobite Sale)**: Memvalidasi foto bukti pengambilan produk oleh customer.

### 5. Dashboard Admin
* **Manajemen Pengguna (CRUD User)**: Mengelola seluruh data akun pengguna di platform.
* **Manajemen Penjualan**: Memantau dan mengelola seluruh aktivitas transaksi Ecobite Sale.
* **Manajemen Donasi**: Memantau dan mengelola seluruh aktivitas donasi Ecobite Share.

---

## 💰 Fitur Wallet (Dompet Digital)

* **Pemisahan Saldo**: Setiap ID Customer dan Seller memiliki dompet terpisah.
* **Mekanisme Deposit (Customer)**:
  * Deposit hanya dapat dilakukan oleh Customer dengan memasukkan nominal deposit.
  * Pembayaran deposit dilakukan via gateway **Midtrans**. Setelah berhasil, saldo *equity wallet* bertambah secara otomatis.
  * Saldo *wallet* tidak bisa bernilai 0.
* **Mekanisme Pembayaran & Pemindahan Dana**:
  * Pembelian produk di dalam web **hanya dapat menggunakan saldo wallet**.
  * Saat pembelian dilakukan, saldo wallet Customer akan terpotong secara otomatis.
  * **Dana tidak langsung masuk ke wallet Seller**. Pembayaran harus divalidasi terlebih dahulu oleh Validator sebelum dana benar-benar ditransfer ke wallet Seller.

---

## 🔄 Alur Kerja Sistem (System Workflows)

### 1. Flow Customer — Ecobite Sale
1. Customer melakukan **Register / Login**.
2. Masuk ke **Dashboard Customer**, lalu memilih menu **Ecobite Sale**.
3. Sistem menampilkan daftar restoran yang menjual produk dengan setengah harga.
4. Customer memilih restoran dan produk yang diinginkan, lalu menambahkannya ke **Keranjang**.
5. Customer melakukan pembayaran di web menggunakan **Wallet**.
6. Sistem menerbitkan **Receipt / Struk Orderan**.
7. Customer mendatangi kasir restoran yang dipilih dan menunjukkan receipt untuk melakukan pengambilan orderan.
8. Customer selesai / melakukan **Logout**.

### 2. Flow Customer — Ecobite Share (Donasi)
1. Customer melakukan **Register / Login**.
2. Masuk ke **Dashboard Customer**, lalu memilih menu **Ecobite Share**.
3. Customer mengajukan donasi dengan mengisi form yang **wajib menyertakan foto kelayakan bahan makanan**.
4. Pengajuan ditinjau oleh **Validator**.
5. Jika disetujui, customer diberikan receipt terkait pengambilan produk (dengan asumsi produk akan diambil dalam waktu kurang dari 24 jam).
6. Apabila barang sudah diambil oleh pihak penyedia app, status donasi Ecobite Share akan diubah menjadi selesai/diambil.

### 3. Flow Seller — Ecobite
1. Seller melakukan **Register / Login** dan masuk ke **Dashboard Seller**.
2. Seller memilih opsi untuk mengecek data penjualan atau data produk.
3. Untuk transaksi penjualan yang statusnya **Belum Terselesaikan** (namun produk sudah diambil customer):
   * Seller memilih penjualan tersebut.
   * Seller mengirimkan/mengunggah **Foto Bukti Pengambilan Produk**.
4. Foto ini digunakan agar Validator dapat merubah status order penjualan menjadi selesai dan membebaskan dana ke wallet Seller.

### 4. Flow Validator — Ecobite
1. Validator melakukan **Login** dan masuk ke **Dashboard Validator**.
2. Validator dihadapkan pada pilihan tugas:
   * **Validasi Foto Kelayakan Donasi** (Ecobite Share).
   * **Validasi Foto Pengambilan Produk** (Ecobite Sale).
   * **Validasi Pembayaran** sebelum pemindahan dana dari customer ke seller.
3. Merubah status donasi *Ecobite Share* apabila barang telah berhasil diambil.

### 5. Flow Admin — Ecobite
1. Admin melakukan **Login** dan masuk ke **Dashboard Admin**.
2. Admin mengelola keseluruhan platform melalui menu:
   * **Manage User (CRUD)**
   * **Manage Ecobite Sale**
   * **Manage Ecobite Share**

---

## 🗄️ Rancangan Database (ERD Konseptual)

### 1. Tabel `users`
| Column Name | Data Type | Constraint/Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `name` | VARCHAR(100) | Nama pengguna / nama restoran |
| `email` | VARCHAR(100) | Unique |
| `password` | VARCHAR(255) | Hashed password |
| `role` | ENUM | 'Customer', 'Seller', 'Validator', 'Admin' |
| `phone` | VARCHAR(20) | Nomor telepon |
| `address` | TEXT | Alamat (untuk seller atau lokasi pickup donasi) |
| `created_at` | TIMESTAMP | Waktu akun dibuat |

### 2. Tabel `wallets`
| Column Name | Data Type | Constraint/Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `user_id` | INT (FK) | Relasi ke `users.id` |
| `balance` | DECIMAL(10,2) | Saldo saat ini (Default: 0) |
| `updated_at` | TIMESTAMP | Waktu terakhir saldo berubah |

### 3. Tabel `wallet_transactions`
| Column Name | Data Type | Constraint/Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `wallet_id` | INT (FK) | Relasi ke `wallets.id` |
| `type` | ENUM | 'Deposit', 'Payment_Sale', 'Revenue_Sale' |
| `amount` | DECIMAL(10,2) | Jumlah uang |
| `status` | ENUM | 'Pending', 'Success', 'Failed' |
| `reference_id` | INT | Relasi ke ID Order (jika ada) |
| `created_at` | TIMESTAMP | Waktu transaksi |

### 4. Tabel `products`
| Column Name | Data Type | Constraint/Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `seller_id` | INT (FK) | Relasi ke `users.id` (Role = Seller) |
| `name` | VARCHAR(150) | Nama makanan |
| `description` | TEXT | Deskripsi makanan |
| `original_price`| DECIMAL(10,2) | Harga asli |
| `discount_price`| DECIMAL(10,2) | Harga setelah diskon (setengah harga) |
| `stock` | INT | Sisa stok makanan |
| `image_url` | VARCHAR(255) | Link foto produk |
| `is_active` | BOOLEAN | Status aktif/tidak produk |

### 5. Tabel `ecobite_sales` (Transaksi Penjualan)
| Column Name | Data Type | Constraint/Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `customer_id` | INT (FK) | Relasi ke `users.id` (Customer) |
| `seller_id` | INT (FK) | Relasi ke `users.id` (Seller) |
| `product_id` | INT (FK) | Relasi ke `products.id` |
| `qty` | INT | Jumlah produk dibeli |
| `total_price` | DECIMAL(10,2) | Total bayar |
| `receipt_code` | VARCHAR(50) | Kode penukaran untuk kasir |
| `pickup_photo` | VARCHAR(255) | Foto bukti barang diambil (dari Seller) |
| `status` | ENUM | 'Paid', 'Waiting_Validation', 'Completed', 'Cancelled' |
| `validator_id` | INT (FK) | Relasi ke `users.id` (Validator penilai) |
| `created_at` | TIMESTAMP | Waktu order |

### 6. Tabel `ecobite_shares` (Pengajuan Donasi)
| Column Name | Data Type | Constraint/Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `customer_id` | INT (FK) | Relasi ke `users.id` (Customer) |
| `item_name` | VARCHAR(150) | Nama bahan makanan |
| `description` | TEXT | Kondisi bahan makanan |
| `food_photo` | VARCHAR(255) | Foto kelayakan (dari Customer) |
| `receipt_code` | VARCHAR(50) | Diterbitkan jika donasi di-ACC |
| `status` | ENUM | 'Pending', 'Approved', 'Rejected', 'Taken' |
| `validator_id` | INT (FK) | Relasi ke `users.id` (Validator penilai) |
| `pickup_deadline`| DATETIME | Batas waktu pengambilan (<24 jam) |
| `created_at` | TIMESTAMP | Waktu donasi diajukan |