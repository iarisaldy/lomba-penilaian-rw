# 📘 PANDUAN PENGGUNAAN SISTEM PENILAIAN LOMBA PERMATA DISCOVERY

Sistem Penilaian Lomba berbasis Web & Mobile ini didesain khusus untuk memudahkan penilaian realtime, kalkulasi rekapitulasi otomatis, perlindungan kerahasiaan nilai antar-juri, serta penguncian final data pemenang lomba.

---

## 📱 APLIKASI WEB & AKSES
- **URL Website**: [https://lomba-permata-discovery.vercel.app/](https://lomba-permata-discovery.vercel.app/)
- **Database Engine**: Supabase PostgreSQL Cloud (Realtime Live Sync 15ms)
- **Kompatibilitas**: HP Android, iPhone, Tablet, Laptop, dan PC.

---

## 👤 BAGIAN 1: PANDUAN UNTUK DEWAN JURI

### 1. Login Juri
1. Scan **QR Code** lomba menggunakan kamera HP / WhatsApp atau buka URL aplikasi di atas.
2. Pada layar utama, masukkan **4 Digit PIN Akses Juri** (Contoh: Juri RT 01 = `1111`, Juri RT 02 = `2222`, dst.).
3. Tekan **Masuk Aplikasi**.

### 2. Mengisi Nilai di HP
1. Di layar HP, Anda akan melihat kartu penilaian untuk setiap peserta/RT.
2. **Cara Mengisi Nilai**:
   - Tekan tombol **`+`** (tambah 1) atau **`-`** (kurangi 1) dengan jempol untuk penyesuaian nilai yang cepat dan akurat.
   - Atau geser batang **Slider** kriteria nilai.
   - Atau ketik angka langsung pada kotak nilai.
3. Nilai yang Anda input tersimpan secara **otomatis (*Auto-Saved*)** ke database pusat Supabase dan memori HP.
4. *Catatan*: Kartu untuk RT Anda sendiri secara otomatis **dikecualikan (N/A)** dari perhitungan.

### 3. Mengunci Nilai Permanen (`🔒 Kunci & Kirim`)
1. Setelah selesai mengisi nilai untuk suatu RT, tekan tombol hijau **`🔒 Kunci & Kirim [Nama RT]`**.
2. **PENTING**: Sekali dikunci oleh Juri, nilai RT tersebut **terkunci permanen** (tombol ubah nilai hilang). Ini mencegah terjadinya perubahan nilai setelah pengumuman pemenang.
3. Jika ada kesalahan input resmi, hubungi Admin Panitia untuk bantuan pembukaan kunci kartu.

### 4. Akses Rekapitulasi & Pemenang Bagi Juri
1. Selama masa penilaian aktif, Tab **Rekapitulasi & Pemenang** disembunyikan dari Juri (*tampil status Penilaian Sedang Berlangsung*) untuk **menjaga independensi & objektivitas nilai antar-juri**.
2. Tab Rekapitulasi akan **otomatis terbuka untuk semua juri** setelah Admin Panitia menekan tombol **`🔒 Kunci Semua Penilaian (Final)`**.

---

## 👑 BAGIAN 2: PANDUAN UNTUK ADMIN PANITIA & PAK RW

### 1. Login Admin
1. Pada layar login, masukkan **PIN Admin Panitia** (Default: **`0000`**).
2. Mode Admin memberikan hak akses penuh untuk memantau nilai seluruh juri, mengatur lomba, serta melakukan penguncian final.

### 2. Mengatur Lomba Baru (Multi-Lomba)
Sistem ini dapat digunakan untuk berbagai jenis lomba (Lomba Blind Rias, Lomba Mewarnai, Lomba Karaoke, Lomba Tumpeng, Lomba Kebersihan, Balap Karung, dsb.).

1. Klik tombol **`⚙️ Pengaturan Lomba & Kriteria`** di bagian atas navbar header.
2. Pada Tab **Informasi Lomba**:
   - Ubah **Judul Utama Lomba** (misal: *LOMBA MEWARNAI ANAK-ANAK*).
   - Ubah Nama Acara, Lokasi, dan PIN Admin jika diperlukan.
3. Klik **Simpan Informasi Lomba**.

### 3. Custom Kriteria Penilaian & Bobot Skor
1. Buka **Pengaturan Lomba & Kriteria** ➔ Tab **Kriteria Penilaian**.
2. **Tambah Kriteria**: Klik **`+ Tambah Kriteria`**, tulis nama kriteria (misal: *Kerapian*, *Kreativitas*, *Kesulitan*, *Kebersihan*), dan tentukan **Skor Maksimal** (misal: 30, 20, 50).
3. **Hapus Kriteria**: Klik ikon tempat sampah di samping kriteria.
4. Total skor maksimal lomba dihitung otomatis oleh sistem.
5. Klik **Simpan Kriteria Penilaian** ➔ Kriteria baru akan **langsung ter-sync di HP seluruh juri secara realtime!**

### 4. Kelola Peserta & Juri
1. Tab **Kelola Peserta**: Tambah/edit/hapus kode RT atau nama tim peserta.
2. Tab **Kelola Juri**: Tambah/edit/hapus nama juri dan **PIN Akses Juri**.
3. Klik **Simpan**.

### 5. Master Lock Final (Kunci Seluruh Penilaian)
Untuk menghindari perdebatan atau perubahan nilai saat/setelah pengumuman pemenang:
1. Begitu waktu penilaian selesai (misal jam 19.40), Admin membuka Panel Admin ➔ klik tombol **`🔒 Kunci Semua Penilaian (Final)`**.
2. Seluruh formulir penilaian di HP semua juri seketika terkunci total secara otomatis.
3. Tampilan di HP juri akan berubah menjadi: `🔒 PENILAIAN LOMBA TELAH DITUTUP RESMI SEBAGAI FINAL`. Tab Rekapitulasi otomatis terbuka transparan.

### 6. Rekapitulasi, Download Excel, & Cetak PDF
1. Buka Tab **Rekapitulasi & Pemenang** untuk melihat peringkat Juara 1, Juara 2, Juara 3 secara otomatis.
2. **Download Excel / CSV**: Klik **`Download Excel / CSV`** untuk menyimpan file rekapitulasi nilai lengkap ke komputer.
3. **Cetak Berita Acara (PDF)**: Buka Tab **Cetak Berita Acara (PDF)** untuk mencetak atau menembus berita acara hasil lomba untuk ditandatangani Ketua RW.

### 7. Reset Data Nilai (Dengan Auto-Backup Safety)
1. Jika ingin mengosongkan nilai untuk perlombaan baru, klik **`Reset Data Nilai`** pada Panel Admin.
2. **Pengaman Auto-Backup**: Sebelum data nilai dikosongkan, sistem akan **secara otomatis mengunduh file Backup Excel (.csv) & Snapshot JSON** ke komputer Admin agar data lama tidak hilang.
3. Masukkan PIN Admin untuk mengonfirmasi pengosongan data.

---

## 🔒 FITUR KEAMANAN & INTEGRITAS DATA
1. **Aturan Eksklusi RT Sendiri (N/A)**: Juri dari RT 01 secara matematis tidak bisa memberikan nilai ke RT 01 (otomatis bernilai N/A agar adil).
2. **Auto-Reseed dari HP Juri**: Jika terjadi masalah koneksi internet/server restart, HP Juri akan secara otomatis mengirimkan kembali (*auto-reseed*) salinan nilai lokalnya ke server.
3. **Supabase PostgreSQL Cloud**: Seluruh data tersimpan secara terpusat dan aman pada database Supabase Cloud.

---
*Dibuat khusus untuk Panitia & Warga Permata Discovery.*
