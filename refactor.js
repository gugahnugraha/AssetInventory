const fs = require("fs");
const path = "src/app/(dashboard)/assets/AssetFormClient.tsx";
let code = fs.readFileSync(path, "utf-8");

// Add activeTab state
code = code.replace(
  "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);",
  "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);\n  const [activeTab, setActiveTab] = React.useState(\"utama\");"
);

// Add Tab headers
const tabHeaders = `      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("utama")}
          className={\`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap \${
            activeTab === "utama"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }\`}
        >
          Identitas & Kode Aset
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("spesifikasi")}
          className={\`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap \${
            activeTab === "spesifikasi"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }\`}
        >
          Spesifikasi & Harga
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("penempatan")}
          className={\`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap \${
            activeTab === "penempatan"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }\`}
        >
          Penempatan & Kondisi
        </button>
      </div>

      <form`;

code = code.replace("      <form", tabHeaders);

// Wrap Tabs
// Instead of complex regex, we split by CardTitle or similar distinct boundaries.
// We know lg:col-span-2 space-y-6 starts the left column.

code = code.replace(
  /<div className="lg:col-span-2 space-y-6">\s*<Card className="border-zinc-200\/80 dark:border-zinc-800\/80">\s*<CardHeader className="border-b border-zinc-100 dark:border-zinc-800">\s*<CardTitle>Identitas Utama<\/CardTitle>/,
  "<div className=\"lg:col-span-2\">\n          {/* TAB UTAMA */}\n          <div className={activeTab === \"utama\" ? \"space-y-6 block\" : \"hidden\"}>\n          <Card className=\"border-zinc-200/80 dark:border-zinc-800/80\">\n            <CardHeader className=\"border-b border-zinc-100 dark:border-zinc-800\">\n              <CardTitle>Identitas Utama</CardTitle>"
);

// Close Tab Utama before Spesifikasi & Harga
code = code.replace(
  /<Card className="border-zinc-200\/80 dark:border-zinc-800\/80">\s*<CardHeader className="border-b border-zinc-100 dark:border-zinc-800">\s*<CardTitle>Spesifikasi & Harga<\/CardTitle>/,
  "</div>\n          {/* TAB SPESIFIKASI */}\n          <div className={activeTab === \"spesifikasi\" ? \"space-y-6 block\" : \"hidden\"}>\n          <Card className=\"border-zinc-200/80 dark:border-zinc-800/80\">\n            <CardHeader className=\"border-b border-zinc-100 dark:border-zinc-800\">\n              <CardTitle>Spesifikasi & Harga</CardTitle>"
);

// Move Kode Aset and Nomor Register into Tab Utama
// Actually, in the code right now it goes: Identitas, Spesifikasi, Kode, Nomor, Atribut, Penempatan.
// We need to reorder them!
// Identitas, Kode, Nomor -> Tab Utama
// Spesifikasi, Atribut -> Tab Spesifikasi
// Penempatan -> Tab Penempatan

// This is complex to do with string replacement. Let us just use a structured approach or manual chunks.
fs.writeFileSync("refactor.js.done", "true");
