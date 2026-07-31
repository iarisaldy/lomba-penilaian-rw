# 🏆 Sistem Penilaian & Rekapitulasi Lomba Otomatis (Vercel Ready)
**HUT KEMERDEKAAN RI KE-81 • PERMATA DISCOVERY**

Aplikasi web modern untuk otomatisasi penilaian dan rekapitulasi **Lomba Blind Rias Ibu-Ibu & Lomba Antar-RT**. Dibuat menggunakan **Next.js 14, TypeScript, & Tailwind CSS** untuk menggantikan proses rekap manual Excel/kertas.

---

## 🌟 Fitur Utama

1. **Auto Lock Nilai RT Sendiri (Rule N/A)**:
   - Juri RT 01 secara otomatis terkunci (N/A) saat menilai peserta RT 01.
   - Pembagi nilai rata-rata otomatis menyesuaikan dengan jumlah juri penilai netral (5 juri).
2. **Matriks Rekapitulasi Real-Time**:
   - Perhitungan **Total Nilai** dan **Rata-Rata Nilai** (presisi 2 desimal) dihitung secara instan.
   - Papan Peringkat & Pemenang (🏆 Juara 1 & 🥈 Juara 2) ter-highlight otomatis.
3. **Format Cetak PDF / Berita Acara Resmi**:
   - Tampilan khusus A4 yang presisi dengan dokumen resmi (`rekap_penilaian_sie_acara_rw_v3.pdf`).
   - Dilengkapi KOP HUT RI ke-81 Permata Discovery & kolom tanda tangan Koordinator Sie Acara serta Ketua RW.
4. **Fitur Pendukung**:
   - **Isi Data Contoh (Demo)**: Memasukkan data nilai sampel 6 juri dengan 1 klik untuk pengujian.
   - **Export & Import JSON**: Memudahkan backup data nilai antar panitia.
   - **Auto-Save LocalStorage**: Data nilai tersimpan di browser tanpa khawatir terhapus saat refresh.

---

## 🚀 Cara Menjalankan Secara Lokal

```bash
# 1. Masuk ke direktori project
cd /Users/muhammadirfan/Documents/lomba

# 2. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🌐 Cara Deploy ke Vercel (Gratis & Cepat)

### Opsi A: Lewat GitHub & Vercel Dashboard (Rekomendasi)
1. Push project ini ke repository GitHub Anda (misal `lomba-penilaian-rw`).
2. Buka [https://vercel.app](https://vercel.app) atau [https://vercel.com](https://vercel.com) dan login.
3. Klik **"Add New"** -> **"Project"**.
4. Import repository GitHub `lomba-penilaian-rw`.
5. Klik **"Deploy"** (Vercel akan mendeteksi Next.js secara otomatis).

### Opsi B: Lewat Vercel CLI (Langsung dari Terminal)
```bash
# Install Vercel CLI jika belum ada
npm install -g vercel

# Deploy project
vercel
```

---

## 📁 Struktur Dokumen Acuan

Dokumen fisik acuan tersimpan di folder `docs/`:
- `docs/rekap_penilaian_sie_acara_rw_v3.pdf`
- `docs/formulir_penilaian_lomba_blind_rias_v2.pdf`
