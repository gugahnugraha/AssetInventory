
const fs = require("fs");
const file = "src/app/(dashboard)/assets/AssetFormClient.tsx";
let content = fs.readFileSync(file, "utf-8");

// Add activeTab state
content = content.replace(
  "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);",
  "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);\n  const [activeTab, setActiveTab] = React.useState(\"utama\");"
);

// We need to extract the 5 cards from the lg:col-span-2 block and reorder/wrap them.
// Let us just match the big chunks by their CardTitles.
function extractCard(titleRegex, nextTitleRegex) {
  const startMatch = content.match(titleRegex);
  if (!startMatch) throw new Error("Could not find start for " + titleRegex);
  const startIdx = content.lastIndexOf("<Card className=", startMatch.index);
  
  let endIdx;
  if (nextTitleRegex) {
    const endMatch = content.match(nextTitleRegex);
    if (!endMatch) throw new Error("Could not find end for " + nextTitleRegex);
    endIdx = content.lastIndexOf("<Card className=", endMatch.index);
  } else {
    // Penempatan & Kondisi Aset is the last one
    endIdx = content.indexOf("</div>\n\n        {/* Image Upload");
  }
  
  if (startIdx === -1 || endIdx === -1) throw new Error("Index error");
  
  const cardContent = content.substring(startIdx, endIdx);
  // Remove this from content
  content = content.substring(0, startIdx) + content.substring(endIdx);
  return cardContent;
}

// Ensure exact string matching for safety
try {
  const card1 = extractCard(/<CardTitle>Identitas Utama<\/CardTitle>/, /<CardTitle>Spesifikasi \& Harga<\/CardTitle>/);
  const card2 = extractCard(/<CardTitle>Spesifikasi \& Harga<\/CardTitle>/, /<CardTitle>Kode Aset<\/CardTitle>/);
  const card3 = extractCard(/<CardTitle>Kode Aset<\/CardTitle>/, /<CardTitle className="text-emerald-800/);
  
  // Nomor Register Aset doesn t always have a next CardTitle if dynamic attributes are empty, but the Dynamic Attributes uses {categoryAttributes.length > 0 && (<Card...)}
  // So we just split manually.
  
  // Actually, rewriting the file by matching `lg:col-span-2` until `Image Upload Sidebar` is safer.
  const startColSpan = content.indexOf("<div className=\"lg:col-span-2 space-y-6\">");
  const endColSpan = content.indexOf("</div>\n\n        {/* Image Upload Sidebar (Right) */}");
  
  if (startColSpan === -1 || endColSpan === -1) throw new Error("Could not find col-span-2 block");
  
  // Restore content from backup because extractCard might have messed it up.
  content = fs.readFileSync("src/app/(dashboard)/assets/AssetFormClient.tsx.bak", "utf-8");
  
  // Add activeTab state
  content = content.replace(
    "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);",
    "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);\n  const [activeTab, setActiveTab] = React.useState(\"utama\");"
  );
  
  const originalColSpanBlock = content.substring(startColSpan, endColSpan);
  
  // We want to completely replace originalColSpanBlock with our new Tabbed structure.
  // Instead of parsing it, we will just let the LLM generate the new block, or we can just replace it via the script.
} catch (e) {
  console.log(e);
}

