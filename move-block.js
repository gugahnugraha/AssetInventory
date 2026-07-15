const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'assets', 'AssetFormClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetBlockStart = '            <Card className="border-zinc-200/80 dark:border-zinc-800/80">\r\n              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">\r\n                <CardTitle>Kode Aset</CardTitle>';
const targetBlockEndStr = '              </CardContent>\r\n            </Card>\r\n          </div>\r\n\r\n          {/* TAB: SPESIFIKASI */}';

// We need to extract the block starting from the targetBlockStart up to just before `          </div>\r\n\r\n          {/* TAB: SPESIFIKASI */}`.
// Let's use regex or indexOf
const startIndex = content.indexOf('            <Card className="border-zinc-200/80 dark:border-zinc-800/80">\n              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">\n                <CardTitle>Kode Aset</CardTitle>') !== -1 
  ? content.indexOf('            <Card className="border-zinc-200/80 dark:border-zinc-800/80">\n              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">\n                <CardTitle>Kode Aset</CardTitle>')
  : content.indexOf('            <Card className="border-zinc-200/80 dark:border-zinc-800/80">\r\n              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">\r\n                <CardTitle>Kode Aset</CardTitle>');

if (startIndex === -1) {
    console.error("Could not find start index");
    process.exit(1);
}

const endIndexMarkerStr = '            </Card>\n          </div>\n\n          {/* TAB: SPESIFIKASI */}';
const endIndexMarkerStrWin = '            </Card>\r\n          </div>\r\n\r\n          {/* TAB: SPESIFIKASI */}';

let endIndex = content.indexOf(endIndexMarkerStr, startIndex);
let isWin = false;
if (endIndex === -1) {
    endIndex = content.indexOf(endIndexMarkerStrWin, startIndex);
    isWin = true;
}

if (endIndex === -1) {
    console.error("Could not find end index");
    process.exit(1);
}

// Extract the block including the closing Card tag
const blockToMove = content.substring(startIndex, endIndex + (isWin ? 21 : 19));

// Remove block from old location
content = content.substring(0, startIndex) + content.substring(endIndex + (isWin ? 21 : 19));

// Insert block at the new location
const insertionMarker = isWin 
  ? '          <div className={activeTab === "utama" ? "space-y-6 block" : "hidden"}>\r\n'
  : '          <div className={activeTab === "utama" ? "space-y-6 block" : "hidden"}>\n';

const insertIndex = content.indexOf(insertionMarker);

if (insertIndex === -1) {
    console.error("Could not find insert index");
    process.exit(1);
}

content = content.substring(0, insertIndex + insertionMarker.length) + blockToMove + (isWin ? '\r\n\r\n' : '\n\n') + content.substring(insertIndex + insertionMarker.length);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Moved successfully!');
