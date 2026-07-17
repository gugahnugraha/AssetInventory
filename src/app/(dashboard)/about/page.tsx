"use client";

import React from "react";
import {
  Info,
  Code2,
  Database,
  Shield,
  Layers,
  Globe,
  Server,
  Cpu,
  Package,
  Palette,
  Lock,
  BarChart3,
  FileText,
  Box,
  Sparkles,
} from "lucide-react";

/* Inline SVGs for brand icons not in this lucide version */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
import { cn } from "@/lib/utils";

/* ─────────────────────────────────── */
/*  Data                               */
/* ─────────────────────────────────── */

const APP_VERSION = "1.0.0";
const APP_NAME = "Sistem Informasi Inventarisasi Aset";
const BUILD_DATE = "Juli 2026";

const techStack = [
  {
    category: "Frontend Framework",
    icon: Layers,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    items: [
      { name: "Next.js 16", desc: "React framework dengan App Router & SSR" },
      { name: "React 19", desc: "UI library terbaru dengan concurrent features" },
      { name: "TypeScript", desc: "Type-safe JavaScript untuk kode yang lebih robust" },
    ],
  },
  {
    category: "Styling & UI",
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    items: [
      { name: "Tailwind CSS v4", desc: "Utility-first CSS framework" },
      { name: "Lucide React", desc: "Koleksi ikon SVG yang konsisten" },
      { name: "Tailwind Animate", desc: "Animasi CSS dengan kelas utility" },
    ],
  },
  {
    category: "Backend & Database",
    icon: Database,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    items: [
      { name: "Prisma ORM v7", desc: "Database ORM modern dengan type safety penuh" },
      { name: "PostgreSQL", desc: "Relational database yang handal & skalabel" },
      { name: "Next.js API Routes", desc: "Serverless API endpoint terintegrasi" },
    ],
  },
  {
    category: "Autentikasi & Keamanan",
    icon: Lock,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    items: [
      { name: "Auth.js (NextAuth v5)", desc: "Autentikasi berbasis sesi yang aman" },
      { name: "bcryptjs", desc: "Enkripsi password dengan hashing adaptif" },
      { name: "Role-Based Access Control", desc: "Kontrol akses berbasis peran (RBAC)" },
    ],
  },
  {
    category: "Data & Visualisasi",
    icon: BarChart3,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    items: [
      { name: "Recharts", desc: "Chart library berbasis React & D3" },
      { name: "TanStack Table v8", desc: "Headless table dengan fitur sorting & filter" },
      { name: "React Hook Form + Zod", desc: "Form management & validasi schema" },
    ],
  },
  {
    category: "Ekspor & File",
    icon: FileText,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    items: [
      { name: "@react-pdf/renderer", desc: "Generate PDF langsung dari komponen React" },
      { name: "xlsx", desc: "Export data ke format Excel" },
      { name: "AWS S3 SDK", desc: "Penyimpanan file & dokumen aset di cloud" },
    ],
  },
  {
    category: "Infrastruktur",
    icon: Server,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20",
    items: [
      { name: "Vercel / Node.js", desc: "Deployment platform & runtime environment" },
      { name: "pg (node-postgres)", desc: "Native PostgreSQL driver untuk Node.js" },
      { name: "Sharp", desc: "Optimasi & pemrosesan gambar server-side" },
    ],
  },
  {
    category: "Utilitas",
    icon: Package,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    items: [
      { name: "clsx + tailwind-merge", desc: "Manajemen class CSS yang dinamis" },
      { name: "QRCode", desc: "Generate QR Code untuk pelabelan aset" },
      { name: "html2pdf.js", desc: "Konversi halaman HTML menjadi dokumen PDF" },
    ],
  },
];

const features = [
  { icon: Box, label: "Manajemen Aset", desc: "Data aset & mutasi lengkap" },
  { icon: BarChart3, label: "Dashboard Analitik", desc: "Visualisasi data real-time" },
  { icon: Shield, label: "Multi-Role Access", desc: "Admin, Operator & Manager" },
  { icon: FileText, label: "Laporan PDF & Excel", desc: "Ekspor data fleksibel" },
  { icon: Database, label: "Master Data", desc: "KIB, kategori & distribusi" },
  { icon: Sparkles, label: "Rekonsiliasi Aset", desc: "Sinkronisasi & validasi data" },
];

/* ─────────────────────────────────── */
/*  Component                          */
/* ─────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Hero Section ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-8 sm:p-10 text-white shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-inner shrink-0">
              <Shield className="h-8 w-8 text-emerald-200" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{APP_NAME}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/60 border border-emerald-400/40 text-emerald-100 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  v{APP_VERSION}
                </span>
              </div>
              <p className="mt-2 text-emerald-200 text-sm sm:text-base leading-relaxed max-w-xl">
                Platform manajemen inventarisasi aset pemerintah daerah yang modern, aman, dan efisien. Dirancang untuk membantu pengelolaan aset SKPD Kabupaten Bandung secara digital dan terpusat.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Versi <strong className="text-white">{APP_VERSION}</strong>
                </span>
                <span className="text-emerald-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  Rilis <strong className="text-white">{BUILD_DATE}</strong>
                </span>
                <span className="text-emerald-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Next.js <strong className="text-white">16</strong> &amp; React <strong className="text-white">19</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features Grid ── */}
        <div>
          <SectionTitle icon={Cpu} title="Fitur Utama" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{f.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tech Stack ── */}
        <div>
          <SectionTitle icon={Layers} title="Technology Stack" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {techStack.map((group) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.category}
                  className={cn(
                    "rounded-xl border p-5 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200",
                    group.border,
                    "dark:border-zinc-700/60"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg border", group.bg, group.border)}>
                      <Icon className={cn("h-4.5 w-4.5", group.color)} />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{group.category}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item.name} className="flex items-start gap-2.5">
                        <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", group.color.replace("text-", "bg-"))} />
                        <div>
                          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.name}</span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Developer Card ── */}
        <div>
          <SectionTitle icon={Code2} title="Developer" />
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-20 relative">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center shrink-0">
                  <span className="text-3xl font-black text-white select-none">G</span>
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Gugah Nugraha</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Full-Stack Developer</p>
                </div>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-5">
                Pengembang aplikasi berbasis web dengan spesialisasi di ekosistem Next.js, React, dan TypeScript. Berpengalaman dalam membangun sistem informasi pemerintahan yang aman, skalabel, dan mudah digunakan.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/gugahnugraha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-700 dark:hover:bg-zinc-700 border border-zinc-700 dark:border-zinc-600 hover:border-zinc-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-sm font-semibold group"
                >
                  <GithubIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  GitHub
                  <span className="text-zinc-400 text-xs">/ gugahnugraha</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/gugah-nugraha-313579160/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0077B5] text-white hover:bg-[#005f92] border border-[#0077B5]/40 hover:border-[#005f92] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-sm font-semibold group"
                >
                  <LinkedinIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  LinkedIn
                  <span className="text-blue-200 text-xs">/ gugah-nugraha</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Note ── */}
        <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
          <p>
            © {new Date().getFullYear()} {APP_NAME} — v{APP_VERSION}
          </p>
          <p className="mt-1 text-xs">
            Dikembangkan dengan ♥ oleh{" "}
            <a
              href="https://github.com/gugahnugraha"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Gugah Nugraha
            </a>{" "}
            untuk Kabupaten Bandung
          </p>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────── */
/*  Helper Components                  */
/* ─────────────────────────────────── */

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 dark:from-emerald-800/50 to-transparent" />
    </div>
  );
}
