# 🏆 Sistem Penilaian & Rekapitulasi Lomba Realtime
### **PERUMAHAN PERMATA DISCOVERY • HUT KEMERDEKAAN RI**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-lomba--permata--discovery.vercel.app-00C7B7?style=for-the-badge&logo=vercel)](https://lomba-permata-discovery.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

Aplikasi Web & Mobile modern untuk otomatisasi penilaian, penguncian integritas nilai, rekapitulasi otomatis realtime, dan penetapan pemenang perlombaan antar-RT/Tim di **Perumahan Permata Discovery**.

Dibuat menggunakan **Next.js 16 (App Router), TypeScript, Tailwind CSS, dan Supabase PostgreSQL** untuk menggantikan proses rekap manual Excel/kertas dengan kecepatan respons **15ms** dan sistem penguncian keamanan bertingkat.

---

### 🌐 URL Akses Direct Link Per Event

| Event Perlombaan | URL Akses Langsung | Peserta & Penilai | Skema Skor |
|---|---|---|---|
| 🚲 **Lomba Sepeda Hias** | `/?event=sepeda-hias` | 100 Peserta Individu (Penilai Ketua RT 01-06) | Skala 1 - 100 |
| 🌸 **Lomba Blind Rias Ibu-Ibu** | `/?event=blind-rias` (atau `/`) | 6 Peserta RT (RT 01 s/d RT 06) | 4 Kriteria (Max 30, 30, 20, 20) |

---

## 🌟 Fitur-Fitur Utama

### 📱 1. Antarmuka Mobile-First Juri (Touch-Friendly)
- **Tombol `-` & `+` Stepper & Range Slider**: Memudahkan dewan juri menginput dan menyesuaikan nilai di layar HP dengan cepat menggunakan jempol.
- **Search Bar & Batch Range Filter**: Fitur pencarian instan peserta (misal ketik `045`) dan quick filter (`001-020`, `021-040`, dll.) untuk penilaian 100 peserta individu.
- **Auto-Save & Reseed Resilien**: Setiap perubahan nilai tersimpan otomatis di Supabase Cloud dan memori lokal HP juri (`localStorage`), sehingga data nilai 100% aman dan tidak akan hilang walau sinyal internet terputus.

### 🛡️ 2. Penguncian Nilai & Keamanan Integritas Penilaian
- **Kunci Permanen Juri (`🔒 Kunci & Kirim`)**: Sekali juri mengunci nilai suatu peserta, nilai tersebut terkunci permanen untuk juri tersebut (tombol ubah hilang) untuk mencegah perubahan nilai setelah pengumuman pemenang.
- **Master System Lock oleh Admin (`🔒 KUNCI PENILAIAN FINAL`)**: Admin memiliki sakelar Master Switch untuk mengunci SELURUH sistem penilaian secara instan begitu waktu penilaian habis.
- **Privasi Rekapitulasi Juri**: Tab rekapitulasi disembunyikan sementara dari Juri selama masa penilaian aktif untuk menjaga **independensi dan objektivitas nilai antar-juri**.

### ⚙️ 3. Pengaturan Lomba Fleksibel (Multi-Lomba & Custom Kriteria)
- **Multi-Lomba Preset & Direct URL Routing**: Memiliki preset siap pakai untuk **Lomba Sepeda Hias** (100 Peserta Individu) dan **Lomba Blind Rias Ibu-Ibu** (6 Peserta RT).
- **Custom Kriteria & Bobot Skor**: Admin dapat menambah, mengubah nama kriteria, serta mengatur bobot skor maksimal (misal Max 100, Max 30) secara dinamis.
- **Single-Table Database Isolation**: Menggunakan 1 tabel Supabase (`scores_state`) dengan isolasi data per event row secara penuh.

### 📊 4. Rekapitulasi Otomatis & Auto-Backup Safety
- **Kalkulasi Rata-Rata Presisi**: Menghitung Total Nilai dan Rata-Rata Nilai secara presisi dengan aturan otomatis eksklusi nilai RT sendiri jika peserta RT.
- **Auto-Backup Sebelum Reset**: Sebelum Admin mengosongkan data nilai untuk lomba baru, sistem secara otomatis mengunduh file **Backup Excel (`.csv`)** dan **Snapshot JSON** ke komputer Admin.
- **Cetak Berita Acara PDF (A4)**: Pratinjau dokumen cetak A4 resmi yang dilengkapi KOP Permata Discovery dan kolom tanda tangan Koordinator Sie Acara serta Ketua RW.

---

## 🔑 Akses Default PIN

| Peran / Juri | Perwakilan | PIN Akses | Keterangan |
|---|---|---|---|
| **Ketua RT 01** | RT 01 | **`1111`** | Penilai Lomba Sepeda Hias & Blind Rias |
| **Ketua RT 02** | RT 02 | **`2222`** | Penilai Lomba Sepeda Hias & Blind Rias |
| **Ketua RT 03** | RT 03 | **`3333`** | Penilai Lomba Sepeda Hias & Blind Rias |
| **Ketua RT 04** | RT 04 | **`4444`** | Penilai Lomba Sepeda Hias & Blind Rias |
| **Ketua RT 05** | RT 05 | **`5555`** | Penilai Lomba Sepeda Hias & Blind Rias |
| **Ketua RT 06** | RT 06 | **`6666`** | Penilai Lomba Sepeda Hias & Blind Rias |
| **Admin Rekap** | Panitia | **`0000`** | Akses Pengaturan Lomba, Master Lock, & Download Rekap |

---

## 🗄️ Database Schema (Supabase SQL)

Jalankan query berikut di **Supabase SQL Editor** untuk membuat tabel database `scores_state`:

```sql
-- 1. Buat tabel penyimpan nilai & konfigurasi lomba
CREATE TABLE IF NOT EXISTS scores_state (
  id TEXT PRIMARY KEY,
  scores JSONB DEFAULT '{}'::jsonb,
  judge_notes JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT NULL,
  locked_cards JSONB DEFAULT '{}'::jsonb,
  reset_timestamp BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aktifkan izin RLS (Read/Write)
ALTER TABLE scores_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON scores_state;
CREATE POLICY "Allow public access" ON scores_state FOR ALL USING (true) WITH CHECK (true);

-- 3. Inisialisasi baris master awal
INSERT INTO scores_state (id, scores, judge_notes, reset_timestamp)
VALUES ('master', '{}'::jsonb, '{}'::jsonb, 0)
ON CONFLICT (id) DO NOTHING;
```

---

## 🚀 Cara Menjalankan Lokal

```bash
# 1. Clone repositori
git clone https://github.com/iarisaldy/lomba-penilaian-rw.git
cd lomba-penilaian-rw

# 2. Install dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🌐 Deploy ke Vercel

1. Import repositori GitHub ini ke Vercel.
2. Tambahkan **Environment Variable**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://rjeiigtqrfhjjunvmlfp.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: *(isi dengan Supabase Anon Key)*
3. Klik **Deploy**.

---

## 📄 Lisensi & Hak Cipta

Designed & Developed with ❤️ by **M. Irfan Arisaldy**  
*Dibuat khusus untuk Panitia Sie Acara & Warga Perumahan Permata Discovery © 2026.*
