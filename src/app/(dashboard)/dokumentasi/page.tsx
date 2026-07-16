"use client";

import React, { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  Database,
  Users,
  Tag,
  FileStack,
  ClipboardCheck,
  Settings,
  User,
  Shield,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Keyboard,
  MousePointerClick,
  RefreshCw,
  Lock,
  Star,
  Zap,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────── */
/*  Types                                                     */
/* ───────────────────────────────────────────────────────── */

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface AccordionItem {
  q: string;
  a: string;
}

/* ───────────────────────────────────────────────────────── */
/*  Data                                                      */
/* ───────────────────────────────────────────────────────── */

const sections: Section[] = [
  { id: "overview", label: "Ikhtisar Aplikasi", icon: BookOpen, color: "emerald" },
  { id: "roles", label: "Peran & Hak Akses", icon: Shield, color: "blue" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "violet" },
  { id: "assets", label: "Data Aset", icon: Boxes, color: "amber" },
  { id: "mutasi", label: "Mutasi Aset", icon: ArrowRightLeft, color: "sky" },
  { id: "distribusi", label: "Bidang & Unit Kerja", icon: Database, color: "indigo" },
  { id: "pemegang", label: "Pemegang Aset", icon: Users, color: "pink" },
  { id: "kategori", label: "Kategori Aset", icon: Tag, color: "orange" },
  { id: "kib", label: "KIB", icon: FileStack, color: "teal" },
  { id: "rekonsiliasi", label: "Rekonsiliasi Aset", icon: ClipboardCheck, color: "rose" },
  { id: "pengaturan", label: "Pengaturan Sistem", icon: Settings, color: "zinc" },
  { id: "profil", label: "Profil & Akun", icon: User, color: "cyan" },
  { id: "tips", label: "Tips & Pintasan", icon: Lightbulb, color: "yellow" },
  { id: "faq", label: "Pertanyaan Umum", icon: HelpCircle, color: "slate" },
];

const faqItems: AccordionItem[] = [
  {
    q: "Apa perbedaan antara Mutasi dan Pemindahan Aset?",
    a: "Mutasi Aset adalah proses perpindahan resmi suatu aset dari satu pemegang barang ke pemegang barang lain, disertai perubahan data pada sistem. Pemindahan fisik tanpa pencatatan di sistem tidak dianggap mutasi resmi.",
  },
  {
    q: "Bagaimana jika saya lupa password?",
    a: "Hubungi Administrator sistem Anda. Administrator dapat mereset password melalui menu Manajemen Pengguna. Operator dan Manager tidak dapat mereset password pengguna lain.",
  },
  {
    q: "Apakah data yang dihapus bisa dikembalikan?",
    a: "Tidak. Penghapusan data bersifat permanen. Pastikan Anda yakin sebelum menghapus aset, pemegang, kategori, atau data lainnya. Sebaiknya ekspor data terlebih dahulu sebagai cadangan.",
  },
  {
    q: "Mengapa tombol Hapus tidak muncul untuk saya?",
    a: "Role Operator tidak memiliki izin menghapus data master seperti Kategori Aset, Pemegang Aset, Bidang & Unit Kerja, maupun aset itu sendiri (tergantung konfigurasi). Hanya Administrator yang memiliki hak penuh.",
  },
  {
    q: "Berapa banyak foto yang bisa diunggah per aset?",
    a: "Setiap aset mendukung pengunggahan hingga beberapa foto. Foto disimpan di penyimpanan objek terdistribusi dan ditampilkan di halaman detail aset.",
  },
  {
    q: "Bagaimana cara mengekspor data aset?",
    a: "Pada halaman Data Aset, terdapat tombol Export di bagian atas tabel. Data akan diekspor dalam format yang dapat dibuka dengan aplikasi spreadsheet.",
  },
  {
    q: "Apa itu KIB?",
    a: "KIB (Kartu Inventaris Barang) adalah pengelompokan aset berdasarkan kategori besar yang ditetapkan dalam standar pengelolaan barang milik daerah, seperti KIB A (Tanah), KIB B (Peralatan & Mesin), KIB C (Gedung & Bangunan), dan seterusnya.",
  },
];

/* ───────────────────────────────────────────────────────── */
/*  Sub-Components                                            */
/* ───────────────────────────────────────────────────────── */

function Badge({
  children,
  color = "emerald",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    sky: "bg-sky-100 text-sky-700 border-sky-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
        colors[color] ?? colors.zinc
      )}
    >
      {children}
    </span>
  );
}

function InfoBox({
  type,
  children,
}: {
  type: "info" | "warning" | "success" | "tip";
  children: React.ReactNode;
}) {
  const config = {
    info: {
      icon: Info,
      cls: "bg-blue-50 border-blue-200 text-blue-800",
      iconCls: "text-blue-500",
    },
    warning: {
      icon: AlertTriangle,
      cls: "bg-amber-50 border-amber-200 text-amber-800",
      iconCls: "text-amber-500",
    },
    success: {
      icon: CheckCircle2,
      cls: "bg-emerald-50 border-emerald-200 text-emerald-800",
      iconCls: "text-emerald-500",
    },
    tip: {
      icon: Lightbulb,
      cls: "bg-violet-50 border-violet-200 text-violet-800",
      iconCls: "text-violet-500",
    },
  };
  const { icon: Icon, cls, iconCls } = config[type];
  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl border text-sm", cls)}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconCls)} />
      <div>{children}</div>
    </div>
  );
}

function RoleCard({
  role,
  color,
  icon,
  can,
  cannot,
}: {
  role: string;
  color: string;
  icon: React.ReactNode;
  can: string[];
  cannot?: string[];
}) {
  const bgMap: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50/50",
    blue: "border-blue-200 bg-blue-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    zinc: "border-zinc-200 bg-zinc-50/50",
  };
  const badgeMap: Record<string, string> = {
    emerald: "emerald",
    blue: "blue",
    amber: "amber",
    zinc: "zinc",
  };
  return (
    <div className={cn("rounded-2xl border-2 p-5 flex flex-col gap-3", bgMap[color] ?? bgMap.zinc)}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white shadow-sm border border-zinc-100">{icon}</div>
        <span className="font-bold text-zinc-900 text-lg">{role}</span>
        <Badge color={badgeMap[color]}>{role}</Badge>
      </div>
      <ul className="space-y-1">
        {can.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            {item}
          </li>
        ))}
        {cannot?.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-zinc-500">
            <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  desc,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-600 text-white font-bold text-sm shrink-0 shadow-md">
          {step}
        </div>
        <div className="w-px flex-1 bg-emerald-200 mt-2 min-h-4" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="font-bold text-zinc-900">{title}</span>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function AccordionFAQ({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-zinc-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <span className="text-sm pr-4">{item.q}</span>
            {open === i ? (
              <ChevronDown className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
            )}
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, color = "emerald" }: { icon: React.ElementType; title: string; subtitle?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-100",
    blue: "text-blue-600 bg-blue-100",
    amber: "text-amber-600 bg-amber-100",
    violet: "text-violet-600 bg-violet-100",
    sky: "text-sky-600 bg-sky-100",
    indigo: "text-indigo-600 bg-indigo-100",
    pink: "text-pink-600 bg-pink-100",
    orange: "text-orange-600 bg-orange-100",
    teal: "text-teal-600 bg-teal-100",
    rose: "text-rose-600 bg-rose-100",
    zinc: "text-zinc-600 bg-zinc-100",
    cyan: "text-cyan-600 bg-cyan-100",
    yellow: "text-yellow-600 bg-yellow-100",
    slate: "text-slate-600 bg-slate-100",
  };
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className={cn("p-3 rounded-xl shrink-0", colorMap[color] ?? colorMap.emerald)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-zinc-950 tracking-tight">{title}</h2>
        {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Main Page                                                 */
/* ───────────────────────────────────────────────────────── */

export default function DokumentasiPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex gap-0 min-h-screen bg-zinc-50/50">
      {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen border-r border-zinc-200 bg-white overflow-y-auto py-6 px-4">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <span className="font-black text-zinc-900 tracking-tight">Dokumentasi</span>
          </div>
          <p className="text-xs text-zinc-400">Panduan Lengkap Penggunaan</p>
        </div>
        <nav className="space-y-0.5">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-emerald-600" : "")} />
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 px-2">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium leading-snug">
              Butuh bantuan lebih? Hubungi Administrator sistem Anda.
            </p>
          </div>
        </div>
      </aside>

      {/* ─── CONTENT ──────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-20">

        {/* OVERVIEW */}
        <section id="overview">
          <SectionTitle icon={BookOpen} title="Ikhtisar Aplikasi" subtitle="Pengenalan sistem manajemen aset inventaris" color="emerald" />

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-8 text-white mb-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight">ASET INVENTARIS</h3>
                <p className="text-emerald-200 text-sm">Sistem Manajemen Barang Milik Daerah</p>
              </div>
            </div>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              Sistem informasi berbasis web untuk mengelola, memantau, dan merekonsiliasi aset barang milik daerah secara terpusat,
              akurat, dan efisien. Dirancang untuk membantu OPD (Organisasi Perangkat Daerah) dalam menjalankan kewajiban
              pencatatan inventaris sesuai standar pemerintah daerah.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Manajemen Aset", icon: Boxes },
                { label: "Mutasi & Transfer", icon: ArrowRightLeft },
                { label: "Laporan KIB", icon: FileStack },
                { label: "Multi-Role Access", icon: Shield },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3 flex flex-col items-center gap-2 text-center border border-white/20">
                  <Icon className="h-5 w-5 text-emerald-200" />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Fitur Utama
              </h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Pencatatan & pengelolaan data aset lengkap",
                  "Mutasi aset antar bidang/unit kerja",
                  "Kartu Inventaris Barang (KIB) digital",
                  "Manajemen pengguna multi-peran (role)",
                  "Ekspor data aset ke spreadsheet",
                  "Diagnostik & monitoring kesehatan sistem",
                  "Unggah foto dan dokumen aset",
                  "Riwayat mutasi aset (audit trail)",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                Teknologi
              </h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Next.js – framework web modern & cepat",
                  "PostgreSQL – database relasional andal",
                  "Prisma ORM – manajemen skema database",
                  "Penyimpanan Objek Terdistribusi – foto aset",
                  "TypeScript – kode terstruktur & aman tipe",
                  "Tailwind CSS – tampilan responsif",
                  "Berbasis cloud – akses dari mana saja",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Zap className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section id="roles">
          <SectionTitle icon={Shield} title="Peran & Hak Akses" subtitle="Setiap pengguna memiliki peran dengan kapabilitas berbeda" color="blue" />
          <InfoBox type="info">
            <strong>Sistem berbasis peran (Role-Based Access Control).</strong> Administrator menetapkan peran saat membuat
            akun pengguna. Peran tidak dapat diubah sendiri oleh pengguna.
          </InfoBox>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <RoleCard
              role="Administrator"
              color="emerald"
              icon={<Shield className="h-5 w-5 text-emerald-600" />}
              can={[
                "Akses penuh ke semua fitur",
                "Mengelola pengguna (tambah, edit, hapus)",
                "Mengelola semua data master",
                "Menghapus aset & rekaman mutasi",
                "Mengakses Pengaturan Sistem",
                "Mengubah password pengguna lain",
              ]}
            />
            <RoleCard
              role="Operator"
              color="blue"
              icon={<User className="h-5 w-5 text-blue-600" />}
              can={[
                "Menambah & mengedit data aset",
                "Melakukan mutasi aset",
                "Mengelola pemegang aset (tambah & edit)",
                "Melihat semua data inventaris",
                "Mengakses kategori & KIB (lihat)",
              ]}
              cannot={[
                "Menghapus data master & aset",
                "Mengelola akun pengguna",
                "Mengakses Pengaturan Sistem",
              ]}
            />
            <RoleCard
              role="Manager"
              color="amber"
              icon={<Eye className="h-5 w-5 text-amber-600" />}
              can={[
                "Melihat semua data inventaris",
                "Melihat laporan & statistik dashboard",
                "Mengekspor data aset",
              ]}
              cannot={[
                "Menambah, mengubah, atau menghapus data",
                "Mengelola pengguna",
                "Melakukan mutasi aset",
              ]}
            />
            <RoleCard
              role="Demo"
              color="zinc"
              icon={<Eye className="h-5 w-5 text-zinc-500" />}
              can={[
                "Menjelajahi seluruh antarmuka sistem",
                "Melihat data contoh inventaris",
              ]}
              cannot={[
                "Menyimpan, mengubah, atau menghapus data",
                "Semua operasi penulisan diblokir",
              ]}
            />
          </div>
        </section>

        {/* DASHBOARD */}
        <section id="dashboard">
          <SectionTitle icon={LayoutDashboard} title="Dashboard" subtitle="Ringkasan kondisi inventaris secara real-time" color="violet" />
          <p className="text-zinc-600 text-sm leading-relaxed mb-5">
            Halaman pertama setelah login. Menampilkan statistik kunci dan kondisi terkini inventaris aset OPD Anda secara sekilas.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { title: "Total Aset", desc: "Jumlah keseluruhan aset yang tercatat dalam sistem, termasuk semua kondisi." },
              { title: "Aset Aktif", desc: "Aset dalam kondisi Baik atau Cukup yang sedang digunakan secara aktif." },
              { title: "Nilai Perolehan", desc: "Total nilai investasi aset berdasarkan harga beli/perolehan yang tercatat." },
              { title: "Distribusi Kondisi", desc: "Proporsi aset berdasarkan kondisi: Baik, Cukup, Rusak Ringan, Rusak Berat." },
              { title: "Aset per Bidang", desc: "Persebaran jumlah aset di setiap bidang/unit kerja dalam OPD." },
              { title: "Mutasi Terakhir", desc: "Aktivitas mutasi aset terbaru yang terjadi dalam sistem." },
            ].map(({ title, desc }) => (
              <div key={title} className="border border-zinc-200 bg-white rounded-2xl p-4">
                <h4 className="font-bold text-zinc-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <InfoBox type="tip">
            Klik kartu statistik untuk langsung menuju halaman terkait (misalnya klik kartu Aset Aktif akan membuka Data Aset dengan filter kondisi).
          </InfoBox>
        </section>

        {/* DATA ASET */}
        <section id="assets">
          <SectionTitle icon={Boxes} title="Data Aset" subtitle="Inti sistem – pencatatan dan pengelolaan seluruh aset" color="amber" />

          <div className="space-y-5">
            <p className="text-sm text-zinc-600 leading-relaxed">
              Halaman utama pencatatan inventaris. Semua aset milik OPD dikelola di sini: dari pengadaan hingga penghapusan.
              Setiap aset memiliki halaman detail yang komprehensif.
            </p>

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                <span className="font-bold text-zinc-900 text-sm">Cara Menambah Aset Baru</span>
              </div>
              <div className="p-5 space-y-0">
                <StepCard step={1} icon={<Plus className="h-4 w-4 text-emerald-600" />} title="Klik tombol Tambah Aset" desc="Tombol berada di pojok kanan atas halaman Data Aset. Hanya Administrator dan Operator yang dapat melihat tombol ini." />
                <StepCard step={2} icon={<Edit3 className="h-4 w-4 text-blue-500" />} title="Isi formulir data aset" desc="Lengkapi semua field wajib: Nama Aset, Nomor Register, KIB, Bidang, Pemegang, Tahun Perolehan, Harga, dan Kondisi." />
                <StepCard step={3} icon={<Plus className="h-4 w-4 text-violet-500" />} title="Unggah foto (opsional)" desc="Tambahkan foto fisik aset untuk dokumentasi visual. Format yang diterima: JPG, PNG, WebP." />
                <StepCard step={4} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} title="Simpan data" desc="Klik tombol Simpan. Data akan langsung muncul di tabel dan dashboard diperbarui secara otomatis." />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
                <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Melihat Detail Aset
                </h4>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2"><MousePointerClick className="h-3.5 w-3.5 mt-0.5 text-zinc-400 shrink-0" />Klik baris aset di tabel untuk membuka detail</li>
                  <li className="flex items-start gap-2"><Eye className="h-3.5 w-3.5 mt-0.5 text-zinc-400 shrink-0" />Atau klik ikon mata (👁) di kolom Aksi</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />Halaman detail menampilkan: foto, spesifikasi, riwayat mutasi, dan dokumen</li>
                </ul>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
                <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-amber-500" />
                  Pencarian & Filter
                </h4>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2"><Search className="h-3.5 w-3.5 mt-0.5 text-zinc-400 shrink-0" />Kolom pencarian di atas tabel – cari berdasarkan nama atau nomor register</li>
                  <li className="flex items-start gap-2"><Tag className="h-3.5 w-3.5 mt-0.5 text-zinc-400 shrink-0" />Filter berdasarkan kategori, KIB, bidang, dan kondisi</li>
                  <li className="flex items-start gap-2"><Download className="h-3.5 w-3.5 mt-0.5 text-zinc-400 shrink-0" />Export data yang sudah difilter ke Excel/CSV</li>
                </ul>
              </div>
            </div>

            <InfoBox type="warning">
              <strong>Hanya Administrator</strong> yang dapat menghapus aset. Operator hanya dapat menambah dan mengubah data.
              Penghapusan aset bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.
            </InfoBox>
          </div>
        </section>

        {/* MUTASI ASET */}
        <section id="mutasi">
          <SectionTitle icon={ArrowRightLeft} title="Mutasi Aset" subtitle="Perpindahan resmi aset antar pemegang atau bidang" color="sky" />
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">
            Mutasi adalah pencatatan resmi perpindahan aset. Setiap mutasi dicatat sebagai riwayat audit yang tidak bisa dihapus.
          </p>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-5">
            <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200">
              <span className="font-bold text-zinc-900 text-sm">Langkah Membuat Mutasi</span>
            </div>
            <div className="p-5 space-y-0">
              <StepCard step={1} icon={<Search className="h-4 w-4 text-sky-500" />} title="Cari Aset" desc="Ketik nama atau nomor register di kolom pencarian. Sistem akan menampilkan daftar aset yang cocok secara real-time (autocomplete)." />
              <StepCard step={2} icon={<MousePointerClick className="h-4 w-4 text-sky-500" />} title="Pilih Aset" desc="Tap/klik aset dari daftar dropdown. Informasi aset (pemegang saat ini, bidang, kondisi) akan ditampilkan otomatis." />
              <StepCard step={3} icon={<Users className="h-4 w-4 text-sky-500" />} title="Tentukan Tujuan" desc="Pilih pemegang baru dan/atau bidang tujuan. Sistem akan menampilkan pilihan yang tersedia." />
              <StepCard step={4} icon={<Edit3 className="h-4 w-4 text-sky-500" />} title="Tambah Keterangan (opsional)" desc="Isikan alasan atau catatan mutasi untuk keperluan audit di masa depan." />
              <StepCard step={5} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} title="Konfirmasi & Simpan" desc="Klik Proses Mutasi. Data aset akan diperbarui dan riwayat mutasi dicatat otomatis." />
            </div>
          </div>

          <InfoBox type="info">
            Fitur pencarian aset di Mutasi sudah dioptimalkan untuk layar sentuh (mobile). Anda dapat mengetuk item dropdown
            secara langsung tanpa masalah.
          </InfoBox>
        </section>

        {/* BIDANG & UNIT KERJA */}
        <section id="distribusi">
          <SectionTitle icon={Database} title="Bidang & Unit Kerja" subtitle="Struktur organisasi yang menjadi dasar pengelompokan aset" color="indigo" />
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">
            Bidang atau Unit Kerja adalah pengelompok utama aset dalam OPD. Setiap aset dan pemegang harus berada di bawah
            salah satu bidang.
          </p>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5">
            <h4 className="font-bold text-zinc-900 mb-3">Pengelolaan Bidang</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Plus, label: "Tambah Bidang", desc: "Administrator: akses penuh. Operator: dapat menambah dengan konfirmasi.", color: "emerald" },
                { icon: Edit3, label: "Edit Bidang", desc: "Administrator: akses penuh. Operator: dapat mengedit.", color: "blue" },
                { icon: Trash2, label: "Hapus Bidang", desc: "Hanya Administrator. Bidang yang memiliki aset tidak dapat dihapus.", color: "rose" },
              ].map(({ icon: Icon, label, desc, color }) => (
                <div key={label} className="border border-zinc-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("h-3.5 w-3.5", color === "rose" ? "text-rose-500" : color === "blue" ? "text-blue-500" : "text-emerald-500")} />
                    <span className="font-semibold text-zinc-900 text-xs">{label}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <InfoBox type="warning">
            Menghapus bidang yang masih memiliki aset atau pemegang akan <strong>ditolak sistem</strong>. Pindahkan atau hapus
            semua data terkait terlebih dahulu.
          </InfoBox>
        </section>

        {/* PEMEGANG ASET */}
        <section id="pemegang">
          <SectionTitle icon={Users} title="Pemegang Aset" subtitle="Individu yang bertanggung jawab atas aset tertentu" color="pink" />
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">
            Pemegang Aset (Pengelola Barang) adalah individu yang secara resmi bertanggung jawab atas keberadaan dan kondisi
            aset yang diberikan kepadanya. Setiap aset harus memiliki pemegang.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3">Data Pemegang</h4>
              <ul className="space-y-1.5 text-sm text-zinc-600">
                {[
                  { label: "Nama Lengkap", req: true },
                  { label: "NIP", req: false },
                  { label: "Jabatan", req: true },
                  { label: "Bidang Penempatan", req: true },
                ].map(({ label, req }) => (
                  <li key={label} className="flex items-center justify-between">
                    <span>{label}</span>
                    <Badge color={req ? "emerald" : "zinc"}>{req ? "Wajib" : "Opsional"}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3">Hak Akses per Role</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { role: "Administrator", can: "Tambah, Edit, Hapus" },
                  { role: "Operator", can: "Tambah & Edit saja" },
                  { role: "Manager", can: "Lihat saja" },
                ].map(({ role, can }) => (
                  <li key={role} className="flex items-center justify-between">
                    <span className="text-zinc-700 font-medium">{role}</span>
                    <span className="text-zinc-500 text-xs">{can}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <InfoBox type="tip">
            NIP bersifat opsional. Untuk non-ASN atau pegawai kontrak, Anda dapat mengosongkan kolom NIP saat mendaftarkan pemegang.
          </InfoBox>
        </section>

        {/* KATEGORI ASET */}
        <section id="kategori">
          <SectionTitle icon={Tag} title="Kategori Aset" subtitle="Pengelompokan jenis aset berdasarkan klasifikasi" color="orange" />
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">
            Kategori digunakan untuk mengklasifikasikan aset berdasarkan jenisnya (misalnya: Komputer, Kendaraan, Furnitur, Printer).
            Setiap aset wajib memiliki kategori.
          </p>
          <InfoBox type="info">
            Operator dapat <strong>melihat</strong> daftar Kategori Aset. Untuk menambah atau menghapus kategori, hanya
            Administrator yang memiliki izin penuh. Operator yang mencoba menghapus akan mendapat notifikasi larangan.
          </InfoBox>
        </section>

        {/* KIB */}
        <section id="kib">
          <SectionTitle icon={FileStack} title="KIB (Kartu Inventaris Barang)" subtitle="Pengelompokan aset sesuai standar pemerintah daerah" color="teal" />
          <p className="text-sm text-zinc-600 leading-relaxed mb-4">
            KIB adalah sistem klasifikasi aset berdasarkan Permendagri tentang pengelolaan barang milik daerah.
            Setiap aset dikaitkan dengan salah satu KIB untuk keperluan pelaporan resmi.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-zinc-200 rounded-2xl overflow-hidden">
              <thead className="bg-teal-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-zinc-900">Kode</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-900">Nama KIB</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-900">Contoh Aset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {[
                  ["KIB A", "Tanah", "Lahan, Kavling, Pekarangan"],
                  ["KIB B", "Peralatan & Mesin", "Kendaraan, Komputer, Printer, AC"],
                  ["KIB C", "Gedung & Bangunan", "Kantor, Gudang, Aula, Toilet"],
                  ["KIB D", "Jalan, Irigasi & Jaringan", "Jalan dinas, Saluran air, Jaringan listrik"],
                  ["KIB E", "Aset Tetap Lainnya", "Buku, Hewan, Tanaman"],
                  ["KIB F", "Konstruksi Dalam Pengerjaan", "Bangunan yang belum selesai"],
                ].map(([kode, nama, contoh]) => (
                  <tr key={kode} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">{kode}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{nama}</td>
                    <td className="px-4 py-3 text-zinc-500">{contoh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* REKONSILIASI */}
        <section id="rekonsiliasi">
          <SectionTitle icon={ClipboardCheck} title="Rekonsiliasi Aset" subtitle="Pemeriksaan silang fisik vs. catatan sistem" color="rose" />
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-rose-200 rounded-2xl bg-rose-50/30">
            <div className="p-4 bg-rose-100 rounded-full mb-4">
              <ClipboardCheck className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="font-black text-zinc-900 text-lg mb-2">Fitur Segera Hadir</h3>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
              Rekonsiliasi Aset sedang dalam pengembangan. Fitur ini akan memungkinkan pemeriksaan silang antara
              kondisi fisik aset di lapangan dengan data yang tercatat dalam sistem, lengkap dengan laporan perbedaan.
            </p>
            <Badge color="rose" >Dalam Pengembangan</Badge>
          </div>
        </section>

        {/* PENGATURAN SISTEM */}
        <section id="pengaturan">
          <SectionTitle icon={Settings} title="Pengaturan Sistem" subtitle="Konfigurasi dan monitoring kesehatan sistem" color="zinc" />
          <InfoBox type="warning">
            Hanya <strong>Administrator</strong> yang dapat mengakses halaman Pengaturan Sistem.
          </InfoBox>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Manajemen OPD",
                desc: "Konfigurasi nama OPD, kode, dan informasi organisasi yang ditampilkan di seluruh sistem.",
                icon: Database,
              },
              {
                title: "Manajemen Pengguna",
                desc: "Tambah, edit, dan nonaktifkan akun pengguna. Tetapkan peran dan reset password.",
                icon: Users,
              },
              {
                title: "Diagnostik Server",
                desc: "Pantau kesehatan sistem: latensi database, penggunaan memori, uptime server, dan status koneksi dengan indikator hijau/kuning/merah.",
                icon: RefreshCw,
              },
            ].map(({ title, desc, icon: Icon }) => (
              <div key={title} className="border border-zinc-200 rounded-2xl p-5 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-zinc-600" />
                  <span className="font-bold text-zinc-900">{title}</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <h4 className="font-bold text-zinc-900 mb-3">Indikator Diagnostik Server</h4>
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-zinc-700">Metrik</th>
                    <th className="px-4 py-3 font-bold text-emerald-600 text-center">🟢 Baik</th>
                    <th className="px-4 py-3 font-bold text-amber-600 text-center">🟡 Perhatian</th>
                    <th className="px-4 py-3 font-bold text-rose-600 text-center">🔴 Kritis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3 text-zinc-700">Latensi Database</td>
                    <td className="px-4 py-3 text-center text-zinc-500">&lt; 150ms</td>
                    <td className="px-4 py-3 text-center text-zinc-500">≥ 150ms</td>
                    <td className="px-4 py-3 text-center text-zinc-500">Offline / Error</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-700">Memori Heap</td>
                    <td className="px-4 py-3 text-center text-zinc-500">&lt; 75%</td>
                    <td className="px-4 py-3 text-center text-zinc-500">75% – 90%</td>
                    <td className="px-4 py-3 text-center text-zinc-500">≥ 90%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* PROFIL */}
        <section id="profil">
          <SectionTitle icon={User} title="Profil & Akun" subtitle="Pengelolaan informasi dan keamanan akun pribadi" color="cyan" />
          <p className="text-sm text-zinc-600 leading-relaxed mb-5">
            Setiap pengguna dapat mengelola profil pribadi mereka melalui menu profil di pojok kanan atas atau navigasi sidebar.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3">Mengubah Password</h4>
              <ol className="space-y-2 text-sm text-zinc-600 list-decimal list-inside">
                <li>Buka menu <strong>Profil</strong> dari sidebar</li>
                <li>Temukan bagian <strong>Ubah Password</strong></li>
                <li>Isi password saat ini dan password baru</li>
                <li>Gunakan ikon 👁 untuk melihat karakter password</li>
                <li>Klik <strong>Simpan Perubahan</strong></li>
              </ol>
            </div>
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3">Informasi yang Dapat Diubah</h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Nama lengkap tampilan
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Password akun
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-zinc-300" />
                  <span className="text-zinc-400">Username (tidak dapat diubah sendiri)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-zinc-300" />
                  <span className="text-zinc-400">Peran / Role (hanya Administrator)</span>
                </li>
              </ul>
            </div>
          </div>
          <InfoBox type="tip">
            Gunakan password yang kuat: minimal 8 karakter, kombinasikan huruf kapital, angka, dan simbol untuk keamanan akun Anda.
          </InfoBox>
        </section>

        {/* TIPS & SHORTCUTS */}
        <section id="tips">
          <SectionTitle icon={Lightbulb} title="Tips & Pintasan" subtitle="Cara cepat berinteraksi dengan sistem" color="yellow" />
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-yellow-500" />
                Pintasan Navigasi
              </h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  ["Klik logo sidebar", "Kembali ke Dashboard"],
                  ["Klik nama header", "Buka menu Profil"],
                  ["Klik baris tabel aset", "Buka detail aset"],
                  ["Klik ikon collapse", "Perkecil/perbesar sidebar"],
                ].map(([action, result]) => (
                  <li key={action} className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded shrink-0">{action}</span>
                    <span className="text-zinc-500 text-xs text-right">{result}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
              <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Rekomendasi Penggunaan
              </h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Daftarkan Bidang terlebih dahulu sebelum menambah Pemegang",
                  "Daftarkan Pemegang sebelum menambah Aset",
                  "Pastikan KIB dan Kategori tersedia sebelum input Aset",
                  "Lakukan mutasi jika ada perpindahan fisik aset",
                  "Export data secara berkala sebagai cadangan",
                  "Pantau Diagnostik Server jika sistem terasa lambat",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <Star className="h-3 w-3 text-yellow-400 mt-1 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border border-zinc-200 rounded-2xl p-5 bg-white">
            <h4 className="font-bold text-zinc-900 mb-3">Urutan Setup Awal yang Disarankan</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {["Buat Akun Pengguna", "→", "Atur Bidang/Unit Kerja", "→", "Daftarkan KIB", "→", "Buat Kategori Aset", "→", "Tambah Pemegang Aset", "→", "Input Data Aset"].map((item, i) => (
                <span key={i} className={cn("text-sm", item === "→" ? "text-zinc-400" : "px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold text-emerald-700")}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <SectionTitle icon={HelpCircle} title="Pertanyaan yang Sering Diajukan" subtitle="Jawaban atas pertanyaan umum pengguna" color="slate" />
          <AccordionFAQ items={faqItems} />
        </section>

        {/* Footer */}
        <div className="pt-6 pb-10 border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-400">
            Dokumentasi ini untuk <strong className="text-zinc-600">Sistem Aset Inventaris</strong> —
            terakhir diperbarui Juli 2026.
          </p>
        </div>
      </main>
    </div>
  );
}
