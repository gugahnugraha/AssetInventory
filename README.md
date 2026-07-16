# 🏛️ Asset Inventory — Sistem Manajemen Aset Daerah

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

**A modern, full-stack web application for managing regional government asset inventories.**

[🇮🇩 Baca dalam Bahasa Indonesia](./README_ID.md)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [User Roles](#-user-roles)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)

---

## 🌟 Overview

**Asset Inventory** is a centralized web-based system for tracking, managing, and reconciling government-owned assets (*Barang Milik Daerah*) across organizational units (OPD — Organisasi Perangkat Daerah). Built with a modern stack and designed for real-world government workflows.

Key capabilities:
- Full asset lifecycle management from acquisition to disposal
- Asset transfer (Mutasi) between units with complete audit trails
- KIB (Kartu Inventaris Barang) reporting per Indonesian government standards
- Role-based access control across multiple user tiers
- Photo and document storage via distributed object storage (Cloudflare R2)
- Real-time dashboard with charts and statistics
- Server diagnostics with live health indicators

---

## ✨ Features

| Feature | Description |
|---|---|
| **Asset Management** | Create, read, update, and delete asset records with full metadata |
| **Asset Transfer (Mutasi)** | Track asset movement between holders and units with audit logs |
| **KIB Classification** | Classify assets per KIB A–F as required by Indonesian government standards |
| **Category Management** | Manage custom asset categories with access control |
| **Holder Management** | Register and manage asset custodians (Pemegang Barang) |
| **Organizational Units** | Manage Bidang/Unit Kerja as the base grouping structure |
| **User Management** | Create and manage users with role-based permissions |
| **Photo Upload** | Upload and store asset photos in cloud object storage |
| **Data Export** | Export asset data to Excel/CSV with active filters |
| **Dashboard Analytics** | Visual charts and real-time statistics using Recharts |
| **Server Diagnostics** | Monitor database latency, memory heap, and uptime with color indicators |
| **QR Code Generation** | Generate QR codes for asset identification labels |
| **PDF Reports** | Generate PDF documents for asset records |
| **Dark Mode** | System-aware dark/light mode via `next-themes` |

---

## 🛠️ Tech Stack

### Core
| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.10 | Full-stack React framework (App Router) |
| [React](https://react.dev) | 19.2 | UI library |
| [TypeScript](https://typescriptlang.org) | 5.x | Type-safe JavaScript |

### Database & ORM
| Technology | Version | Purpose |
|---|---|---|
| [Prisma](https://prisma.io) | 7.x | ORM and database schema management |
| [PostgreSQL](https://postgresql.org) | — | Relational database (via Neon) |
| [@prisma/adapter-pg](https://npmjs.com/package/@prisma/adapter-pg) | 7.x | Direct PostgreSQL adapter |

### Authentication
| Technology | Version | Purpose |
|---|---|---|
| [NextAuth.js](https://authjs.dev) | 5.0-beta | Session management & authentication |
| [bcryptjs](https://npmjs.com/package/bcryptjs) | 3.x | Password hashing |

### Styling & UI
| Technology | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first CSS framework |
| [Lucide React](https://lucide.dev) | 1.x | Icon library |
| [Recharts](https://recharts.org) | 3.x | Charting and data visualization |

### Forms & Validation
| Technology | Version | Purpose |
|---|---|---|
| [React Hook Form](https://react-hook-form.com) | 7.x | Performant form handling |
| [Zod](https://zod.dev) | 4.x | Schema validation |
| [@hookform/resolvers](https://npmjs.com/package/@hookform/resolvers) | 5.x | Zod + RHF integration |

### Storage & Files
| Technology | Purpose |
|---|---|
| [AWS SDK S3 client](https://npmjs.com/package/@aws-sdk/client-s3) | Cloudflare R2 object storage for photos |
| [Sharp](https://sharp.pixelplumbing.com) | Server-side image optimization |
| [XLSX](https://npmjs.com/package/xlsx) | Excel export |
| [@react-pdf/renderer](https://npmjs.com/package/@react-pdf/renderer) | PDF generation |
| [QRCode](https://npmjs.com/package/qrcode) | QR code generation |

---

## 📁 Project Structure

```
src/
├── actions/          # Next.js Server Actions (business logic layer)
│   ├── asset.ts      # Asset CRUD operations
│   ├── holder.ts     # Holder management
│   ├── kategori.ts   # Category management
│   ├── mutasi.ts     # Asset transfer logic
│   ├── opd.ts        # OPD settings & server diagnostics
│   └── ...
├── app/
│   ├── (auth)/       # Authentication pages (login)
│   └── (dashboard)/  # Protected dashboard pages
│       ├── assets/       # Asset list & detail
│       ├── dashboard/    # Main dashboard
│       ├── distribusi/   # Organizational units
│       ├── dokumentasi/  # In-app documentation
│       ├── kategori/     # Asset categories
│       ├── kib/          # KIB management
│       ├── mutasi/       # Asset transfer
│       ├── pemegang/     # Asset holders
│       ├── pengaturan/   # System settings
│       ├── profile/      # User profile
│       ├── rekonsiliasi/ # Asset reconciliation (WIP)
│       └── users/        # User management
├── components/
│   ├── ui/           # Reusable UI primitives
│   ├── Sidebar.tsx   # Main navigation sidebar
│   └── ...
├── lib/              # Utilities (auth, utils)
└── services/         # Database query layer (Prisma wrappers)

prisma/
├── schema.prisma     # Database schema definition
└── seed.js           # Seed data for development
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- A **PostgreSQL** database (e.g., [Neon](https://neon.tech) for serverless)
- A **Cloudflare R2** bucket (or any S3-compatible storage) for file uploads

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gugahnugraha/AssetInventory.git
   cd AssetInventory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   > Prisma client is automatically generated via the `postinstall` script.

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Then fill in the values — see Environment Variables section below
   ```

4. **Push the database schema:**
   ```bash
   npx prisma db push
   ```

5. **Seed initial data (optional):**
   ```bash
   node prisma/seed.js
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in the following values:

```env
# PostgreSQL Database (e.g., Neon connection string)
DATABASE_URL=""

# NextAuth.js secret — generate with: openssl rand -base64 32
AUTH_SECRET=""

# Cloudflare R2 (S3-compatible) Object Storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""          # Public base URL for serving stored assets
```

> **Security note:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 🗄️ Database Setup

This project uses **Prisma ORM** with PostgreSQL.

```bash
# Apply the schema to the database
npx prisma db push

# (Optional) Open Prisma Studio to browse data
npx prisma studio

# (Optional) Seed with sample data
node prisma/seed.js
```

The schema defines the following main models:
- `User` — System users with roles
- `Opd` — Organizational unit (OPD) configuration
- `Distribution` — Bidang/Unit Kerja
- `Holder` — Asset custodians
- `Kategori` — Asset categories
- `Kib` — KIB types (A–F)
- `Asset` — The main asset record
- `AssetTransfer` — Mutation/transfer history

---

## 👥 User Roles

| Role | Description | Permissions |
|---|---|---|
| `ADMINISTRATOR` | Full system access | All CRUD, user management, system settings |
| `OPERATOR` | Day-to-day data entry | Add & edit assets, holders; no delete of master data |
| `MANAGER` | Read-only oversight | View all data, export reports |
| `DEMO` | Demonstration access | Browse UI only, all writes blocked |

---

## 📜 Available Scripts

```bash
npm run dev        # Start development server (Turbopack)
npm run build      # Build production bundle
npm run start      # Start production server
npm run lint       # Run ESLint
```

---

## 🚢 Deployment

This application is optimized for deployment on **Vercel**.

1. Push the repository to GitHub.
2. Import the project on [Vercel](https://vercel.com/new).
3. Set all environment variables in the Vercel project settings.
4. Deploy — Vercel handles everything else automatically.

For other platforms (Railway, Render, etc.), run:
```bash
npm run build
npm run start
```

---

## 🤝 Contributing

This is a private project for government use. For inquiries, contact the maintainer.

---

## 👤 Author

**Gugah Nugraha**
- GitHub: [@gugahnugraha](https://github.com/gugahnugraha)

---

<div align="center">
  <sub>Built with ♥ for better public service</sub>
</div>
