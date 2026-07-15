const fs = require("fs");
const path = "src/app/(dashboard)/assets/AssetFormClient.tsx";
let content = fs.readFileSync(path, "utf-8");

// Add activeTab state
if (!content.includes("activeTab")) {
  content = content.replace(
    "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);",
    "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);\n  const [activeTab, setActiveTab] = React.useState(\"utama\");"
  );
}

const startMarker = "<div className=\"lg:col-span-2 space-y-6\">";
const endMarker = "{/* Image Upload Sidebar (Right) */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const colSpanBlock = content.substring(startIndex, endIndex);

function getBlock(marker, nextMarker) {
  const i1 = colSpanBlock.indexOf(marker);
  const i2 = nextMarker ? colSpanBlock.indexOf(nextMarker) : colSpanBlock.length;
  
  const start = colSpanBlock.lastIndexOf("<Card", i1);
  const end = nextMarker ? colSpanBlock.lastIndexOf("<Card", i2) : colSpanBlock.lastIndexOf("</div>\n\n        ");
  
  if (i1 === -1) return "";
  
  let actualStart = start;
  const condStart = colSpanBlock.lastIndexOf("{categoryAttributes", i1);
  if (condStart !== -1 && condStart > colSpanBlock.lastIndexOf("</Card>", i1)) {
    actualStart = condStart;
  }
  
  return colSpanBlock.substring(actualStart, end).trim();
}

const cIdentitas = getBlock("Identitas Utama", "Spesifikasi & Harga");
const cSpesifikasi = getBlock("Spesifikasi & Harga", "Kode Aset");
const cKode = getBlock("Kode Aset", "Nomor Register Aset");
const cNomor = getBlock("Nomor Register Aset", "Atribut Tambahan");
const cAtribut = getBlock("Atribut Tambahan", "Penempatan & Kondisi Aset");
const cPenempatan = getBlock("Penempatan & Kondisi Aset", null);

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
          Data Utama
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
          Spesifikasi & Atribut
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
      </div>`;

const newBlock = `        <div className="lg:col-span-2">
          {/* TAB: UTAMA */}
          <div className={activeTab === "utama" ? "space-y-6 block" : "hidden"}>
            ${cIdentitas}
            
            ${cKode}
            
            ${cNomor}
          </div>

          {/* TAB: SPESIFIKASI */}
          <div className={activeTab === "spesifikasi" ? "space-y-6 block" : "hidden"}>
            ${cSpesifikasi}
            
            ${cAtribut}
          </div>

          {/* TAB: PENEMPATAN */}
          <div className={activeTab === "penempatan" ? "space-y-6 block" : "hidden"}>
            ${cPenempatan}
          </div>
        </div>

        `;

content = content.replace("<form onSubmit={handleSubmit(onSubmit)} className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">", tabHeaders + "\n\n      <form onSubmit={handleSubmit(onSubmit)} className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">");

content = content.replace(colSpanBlock, newBlock);

fs.writeFileSync(path, content);
console.log("SUCCESS");
