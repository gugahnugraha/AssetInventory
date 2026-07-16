# 🏛️ Aset Inventaris — Sistem Manajemen Barang Milik Daerah

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Lisensi](https://img.shields.io/badge/Lisensi-Privat-red?style=for-the-badge)

**Aplikasi web modern dan full-stack untuk mengelola inventaris aset pemerintah daerah.**

[🇬🇧 Read in English](./README.md)

</div>

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Fitur](#-fitur)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Proyek](#-struktur-proyek)
- [Panduan Memulai](#-panduan-memulai)
- [Variabel Lingkungan](#-variabel-lingkungan)
- [Pengaturan Database](#-pengaturan-database)
- [Peran Pengguna](#-peran-pengguna)
- [Skrip yang Tersedia](#-skrip-yang-tersedia)
- [Deployment](#-deployment)

---

## 🌟 Gambaran Umum

**Aset Inventaris** adalah sistem berbasis web terpusat untuk mencatat, mengelola, dan merekonsiliasi Barang Milik Daerah (BMD) di seluruh unit kerja dalam sebuah OPD (Organisasi Perangkat Daerah). Dibangun dengan teknologi modern dan dirancang sesuai alur kerja pemerintahan nyata.

Kemampuan utama:
- Pengelolaan aset lengkap dari pengadaan hingga penghapusan
- Mutasi aset antar bidang/unit kerja disertai jejak audit lengkap
- Pelaporan KIB (Kartu Inventaris Barang) sesuai standar pemerintah daerah Indonesia
- Kendali akses berbasis peran (role-based) untuk berbagai tingkatan pengguna
- Penyimpanan foto dan dokumen aset di object storage terdistribusi (Cloudflare R2)
- Dashboard real-time dengan grafik dan statistik
- Diagnostik server dengan indikator kesehatan sistem langsung (🟢/🟡/🔴)

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| **Manajemen Aset** | Tambah, lihat, ubah, dan hapus data aset beserta metadata lengkap |
| **Mutasi Aset** | Lacak perpindahan aset antar pemegang/bidang dengan catatan audit |
| **Klasifikasi KIB** | Pengelompokan aset sesuai KIB A–F berdasarkan standar pemerintah daerah |
| **Manajemen Kategori** | Kelola kategori aset kustom dengan kendali akses berbasis peran |
| **Pemegang Barang** | Daftarkan dan kelola pemegang barang (pengelola aset) |
| **Bidang & Unit Kerja** | Kelola Bidang/Unit Kerja sebagai struktur pengelompokan dasar |
| **Manajemen Pengguna** | Buat dan kelola pengguna dengan izin berbasis peran |
| **Unggah Foto** | Unggah dan simpan foto aset di cloud object storage |
| **Ekspor Data** | Ekspor data aset ke Excel/CSV dengan filter aktif |
| **Dashboard Analitik** | Grafik dan statistik real-time menggunakan Recharts |
| **Diagnostik Server** | Pantau latensi database, memori heap, dan uptime dengan indikator warna |
| **Kode QR** | Buat kode QR untuk label identifikasi aset |
| **Laporan PDF** | Generate dokumen PDF dari data aset |
| **Mode Gelap** | Mode gelap/terang otomatis mengikuti preferensi sistem via `next-themes` |

---

## 🛠️ Teknologi yang Digunakan

### Inti
| Teknologi | Versi | Kegunaan |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.10 | Framework React full-stack (App Router) |
| [React](https://react.dev) | 19.2 | Library antarmuka pengguna |
| [TypeScript](https://typescriptlang.org) | 5.x | JavaScript bertipe statis |

### Database & ORM
| Teknologi | Versi | Kegunaan |
|---|---|---|
| [Prisma](https://prisma.io) | 7.x | ORM dan manajemen skema database |
| [PostgreSQL](https://postgresql.org) | — | Database relasional (via Neon) |
| [@prisma/adapter-pg](https://npmjs.com/package/@prisma/adapter-pg) | 7.x | Adapter PostgreSQL langsung |

### Autentikasi
| Teknologi | Versi | Kegunaan |
|---|---|---|
| [NextAuth.js](https://authjs.dev) | 5.0-beta | Manajemen sesi & autentikasi |
| [bcryptjs](https://npmjs.com/package/bcryptjs) | 3.x | Hash password |

### Tampilan & UI
| Teknologi | Versi | Kegunaan |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Framework CSS utility-first |
| [Lucide React](https://lucide.dev) | 1.x | Library ikon |
| [Recharts](https://recharts.org) | 3.x | Grafik dan visualisasi data |

### Formulir & Validasi
| Teknologi | Versi | Kegunaan |
|---|---|---|
| [React Hook Form](https://react-hook-form.com) | 7.x | Pengelolaan formulir performa tinggi |
| [Zod](https://zod.dev) | 4.x | Validasi skema data |
| [@hookform/resolvers](https://npmjs.com/package/@hookform/resolvers) | 5.x | Integrasi Zod + RHF |

### Penyimpanan & File
| Teknologi | Kegunaan |
|---|---|
| [AWS SDK S3 client](https://npmjs.com/package/@aws-sdk/client-s3) | Cloudflare R2 object storage untuk foto |
| [Sharp](https://sharp.pixelplumbing.com) | Optimasi gambar di server |
| [XLSX](https://npmjs.com/package/xlsx) | Ekspor Excel |
| [@react-pdf/renderer](https://npmjs.com/package/@react-pdf/renderer) | Pembuatan PDF |
| [QRCode](https://npmjs.com/package/qrcode) | Pembuatan kode QR |

---

## 📁 Struktur Proyek

```
src/
├── actions/          # Next.js Server Actions (lapisan logika bisnis)
│   ├── asset.ts      # Operasi CRUD aset
│   ├── holder.ts     # Manajemen pemegang aset
│   ├── kategori.ts   # Manajemen kategori
│   ├── mutasi.ts     # Logika mutasi aset
│   ├── opd.ts        # Pengaturan OPD & diagnostik server
│   └── ...
├── app/
│   ├── (auth)/       # Halaman autentikasi (login)
│   └── (dashboard)/  # Halaman dashboard terproteksi
│       ├── assets/       # Daftar & detail aset
│       ├── dashboard/    # Dashboard utama
│       ├── distribusi/   # Bidang & Unit Kerja
│       ├── dokumentasi/  # Dokumentasi dalam aplikasi
│       ├── kategori/     # Kategori aset
│       ├── kib/          # Manajemen KIB
│       ├── mutasi/       # Mutasi aset
│       ├── pemegang/     # Pemegang barang
│       ├── pengaturan/   # Pengaturan sistem
│       ├── profile/      # Profil pengguna
│       ├── rekonsiliasi/ # Rekonsiliasi aset (dalam pengembangan)
│       └── users/        # Manajemen pengguna
├── components/
│   ├── ui/           # Komponen UI yang dapat digunakan kembali
│   ├── Sidebar.tsx   # Navigasi sidebar utama
│   └── ...
├── lib/              # Utilitas (auth, utils)
└── services/         # Lapisan query database (pembungkus Prisma)

prisma/
├── schema.prisma     # Definisi skema database
└── seed.js           # Data awal untuk pengembangan
```

---

## 🚀 Panduan Memulai

### Prasyarat

- **Node.js** versi 18.x atau lebih baru
- **npm** versi 9.x atau lebih baru
- Database **PostgreSQL** (misalnya [Neon](https://neon.tech) untuk serverless)
- Bucket **Cloudflare R2** (atau penyimpanan kompatibel S3) untuk unggahan file

### Instalasi

1. **Clone repositori:**
   ```bash
   git clone https://github.com/gugahnugraha/AssetInventory.git
   cd AssetInventory
   ```

2. **Instal dependensi:**
   ```bash
   npm install
   ```
   > Prisma client di-generate secara otomatis melalui skrip `postinstall`.

3. **Siapkan variabel lingkungan:**
   ```bash
   cp .env.example .env
   # Kemudian isi nilainya — lihat bagian Variabel Lingkungan di bawah
   ```

4. **Push skema database:**
   ```bash
   npx prisma db push
   ```

5. **Seed data awal (opsional):**
   ```bash
   node prisma/seed.js
   ```

6. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```

7. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔐 Variabel Lingkungan

Salin `.env.example` ke `.env` dan isi nilai-nilai berikut:

```env
# Database PostgreSQL (misalnya, connection string dari Neon)
DATABASE_URL=""

# Secret untuk NextAuth.js — buat dengan: openssl rand -base64 32
AUTH_SECRET=""

# Penyimpanan Object Storage Cloudflare R2 (kompatibel S3)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""          # URL publik dasar untuk mengakses file yang tersimpan
```

> **Catatan keamanan:** Jangan pernah commit file `.env` ke repositori. File ini sudah terdaftar di `.gitignore`.

---

## 🗄️ Pengaturan Database

Proyek ini menggunakan **Prisma ORM** dengan PostgreSQL.

```bash
# Terapkan skema ke database
npx prisma db push

# (Opsional) Buka Prisma Studio untuk menelusuri data
npx prisma studio

# (Opsional) Isi dengan data contoh
node prisma/seed.js
```

Skema mendefinisikan model utama berikut:
- `User` — Pengguna sistem dengan peran masing-masing
- `Opd` — Konfigurasi OPD
- `Distribution` — Bidang/Unit Kerja
- `Holder` — Pemegang barang (pengelola aset)
- `Kategori` — Kategori aset
- `Kib` — Jenis KIB (A–F)
- `Asset` — Catatan aset utama
- `AssetTransfer` — Riwayat mutasi/perpindahan aset

---

## 👥 Peran Pengguna

| Peran | Keterangan | Izin |
|---|---|---|
| `ADMINISTRATOR` | Akses penuh ke sistem | Semua CRUD, manajemen pengguna, pengaturan sistem |
| `OPERATOR` | Entri data sehari-hari | Tambah & ubah aset, pemegang; tidak dapat menghapus data master |
| `MANAGER` | Pengawasan hanya-baca | Melihat semua data, ekspor laporan |
| `DEMO` | Akses demonstrasi | Jelajahi UI saja, semua penulisan diblokir |

### Detail Hak Akses per Modul

| Modul | Administrator | Operator | Manager |
|---|---|---|---|
| Data Aset | ✅ Penuh | ✅ Tambah & Edit | 👁️ Lihat |
| Mutasi Aset | ✅ Penuh | ✅ Penuh | 👁️ Lihat |
| Pemegang Aset | ✅ Penuh | ✅ Tambah & Edit | 👁️ Lihat |
| Bidang & Unit Kerja | ✅ Penuh | ✅ Tambah & Edit | 👁️ Lihat |
| Kategori Aset | ✅ Penuh | 👁️ Lihat | 👁️ Lihat |
| KIB | ✅ Penuh | 👁️ Lihat | 👁️ Lihat |
| Manajemen Pengguna | ✅ Penuh | ❌ | ❌ |
| Pengaturan Sistem | ✅ Penuh | ❌ | ❌ |

---

## 📜 Skrip yang Tersedia

```bash
npm run dev        # Jalankan server pengembangan (Turbopack)
npm run build      # Build bundle produksi
npm run start      # Jalankan server produksi
npm run lint       # Jalankan ESLint
```

---

## 🚢 Deployment

Aplikasi ini dioptimalkan untuk deployment di **Vercel**.

1. Push repositori ke GitHub.
2. Import proyek di [Vercel](https://vercel.com/new).
3. Atur semua variabel lingkungan di pengaturan proyek Vercel.
4. Deploy — Vercel menangani selebihnya secara otomatis.

Untuk platform lain (Railway, Render, dll.), jalankan:
```bash
npm run build
npm run start
```

---

## 📖 Dokumentasi Dalam Aplikasi

Setelah masuk ke sistem, navigasikan ke **Dokumentasi** di sidebar untuk panduan lengkap penggunaan fitur, termasuk:
- Panduan langkah demi langkah untuk setiap modul
- Penjelasan peran dan hak akses
- Tabel klasifikasi KIB
- Tips & pintasan navigasi
- Pertanyaan yang sering diajukan (FAQ)

---

## 🤝 Kontribusi

Ini adalah proyek privat untuk keperluan pemerintahan. Untuk pertanyaan, hubungi pengelola.

---

## 👤 Pembuat

**Gugah Nugraha**
- GitHub: [@gugahnugraha](https://github.com/gugahnugraha)

---

<div align="center">
  <sub>Dibangun dengan ♥ untuk pelayanan publik yang lebih baik</sub>
</div>
