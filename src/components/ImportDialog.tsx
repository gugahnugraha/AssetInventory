"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Play, 
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importAssetsBatchAction } from "@/actions/asset";
import { ExcelAssetRow } from "@/services/import";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  distributions: any[];
  onSuccess: () => void;
}

export function ImportDialog({ isOpen, onClose, distributions, onSuccess }: ImportDialogProps) {
  const [defaultDistId, setDefaultDistId] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [rows, setRows] = React.useState<ExcelAssetRow[]>([]);
  const [previewData, setPreviewData] = React.useState<ExcelAssetRow[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [processedCount, setProcessedCount] = React.useState(0);
  const [importSummary, setImportSummary] = React.useState<{
    successCount: number;
    skippedCount: number;
    duplicates: string[];
    errors: string[];
  } | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);

  // Reset state on open/close
  React.useEffect(() => {
    if (isOpen) {
      setFile(null);
      setRows([]);
      setPreviewData([]);
      setImportSummary(null);
      setParseError(null);
      setProgress(0);
      setProcessedCount(0);
      setIsImporting(false);
      setIsParsing(false);
      // Auto select first distribution if available
      if (distributions.length > 0) {
        setDefaultDistId(distributions[0].id);
      }
    }
  }, [isOpen, distributions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setParseError(null);
    setImportSummary(null);
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawJson = XLSX.utils.sheet_to_json<ExcelAssetRow>(worksheet);
        
        if (rawJson.length === 0) {
          setParseError("Berkas Excel kosong atau tidak memiliki baris data.");
          setIsParsing(false);
          return;
        }

        // Filter out empty rows (where "Nama Aset" is undefined or empty string)
        const validRows = rawJson.filter(row => {
          const name = row["Nama Aset"] || (row as any)["Nama"] || (row as any)["nama"];
          return name && String(name).trim() !== "";
        });

        if (validRows.length === 0) {
          setParseError("Berkas Excel tidak memiliki baris data yang valid (Nama Aset kosong semua).");
          setIsParsing(false);
          return;
        }

        // Check if has header columns we expect
        const firstRow = validRows[0];
        if (!("Nama Aset" in firstRow) && !("Nama" in (firstRow as any) || "nama" in (firstRow as any))) {
          setParseError("Judul kolom 'Nama Aset' tidak ditemukan. Pastikan format kolom sesuai panduan.");
          setIsParsing(false);
          return;
        }

        setRows(validRows);
        setPreviewData(validRows.slice(0, 5)); // show first 5 rows
      } catch (err: any) {
        console.error("Failed to parse excel:", err);
        setParseError("Gagal membaca berkas Excel. Pastikan berkas tidak rusak.");
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError("Gagal membaca berkas.");
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleCloseWrapper = () => {
    if (importSummary) {
      onSuccess();
    }
    onClose();
  };

  const handleImport = async () => {
    if (rows.length === 0 || !defaultDistId || isImporting) return;
    setIsImporting(true);
    setParseError(null);
    setImportSummary(null);
    setProgress(0);
    setProcessedCount(0);

    const BATCH_SIZE = 50;
    const plainRows = JSON.parse(JSON.stringify(rows));
    const totalBatches = Math.ceil(plainRows.length / BATCH_SIZE);
    
    let totalSuccess = 0;
    let totalSkipped = 0;
    
    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = plainRows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const res = await importAssetsBatchAction(batch, defaultDistId);
        
        if (res.error) {
          throw new Error(`Batch ${i + 1} gagal: ${res.error}`);
        } else if (res.result) {
          totalSuccess += res.result.successCount;
          totalSkipped += res.result.skippedCount;
          
          const currentProcessed = Math.min((i + 1) * BATCH_SIZE, plainRows.length);
          setProcessedCount(currentProcessed);
          setProgress(Math.round((currentProcessed / plainRows.length) * 100));
        }
      }
      
      setImportSummary({
        successCount: totalSuccess,
        skippedCount: totalSkipped,
        duplicates: [],
        errors: [],
      });
      // Do not call onSuccess() here; let them click "Close" first to reload
      
    } catch (err: any) {
      console.error("Import execution failed:", err);
      setParseError(`Kesalahan kritis: ${err.message || err}`);
      // Do not reset progress/processedCount so they see where it failed
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleCloseWrapper} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          Import Aset massal dari Excel
        </DialogTitle>
        <DialogDescription>
          Unggah berkas spreadsheet (.xlsx) untuk memasukkan ratusan hingga ribuan data aset sekaligus.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        {/* Step 1: Default Placement / Penempatan Bidang */}
        <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200/80">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
            Penempatan Bidang Default <span className="text-rose-500">*</span>
          </label>
          <select
            value={defaultDistId}
            onChange={(e) => setDefaultDistId(e.target.value)}
            disabled={isImporting}
            className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {distributions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-500">
            Aset yang di-import akan otomatis diletakkan pada Bidang/Unit yang dipilih ini.
          </p>
        </div>

        {/* Form Excel Selector */}
        {!importSummary && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-zinc-200 hover:border-emerald-500 rounded-lg p-6 text-center cursor-pointer transition-colors relative bg-zinc-50/50 hover:bg-emerald-50/5">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                {isParsing ? (
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                ) : file ? (
                  <FileText className="h-10 w-10 text-emerald-600" />
                ) : (
                  <Upload className="h-10 w-10 text-zinc-400" />
                )}
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {file ? file.name : "Pilih Berkas Excel (.xlsx)"}
                </p>
                <p className="text-xs text-zinc-400">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Seret berkas kemari atau klik untuk mencari berkas"}
                </p>
              </div>
            </div>

            {/* Parse Error alert */}
            {parseError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Guide Info */}
            {!file && (
              <div className="p-3.5 bg-sky-50/50 border border-sky-100 text-sky-800 rounded-lg text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-sky-600 shrink-0" />
                  Format Judul Kolom Excel yang Didukung:
                </p>
                <div className="font-mono text-[10px] bg-white border p-2 rounded-md overflow-x-auto text-zinc-700">
                  Nama Aset*, Kode Aset, NomorRegister, KIB, Kategori, Bidang Distribusi, Merk/Type, Spesifikasi, Material, Tahun, Harga, Catatan, Nomor Polisi, Nomor Mesin, Nomor Rangka, Perolehan
                </div>
                <p className="leading-relaxed">
                  * Kolom **Nama Aset** wajib diisi. Kolom **KIB** dapat diisi kode huruf (misal: A, B, C). Jika kolom kode1-kode5 tidak ada, sistem akan otomatis mem-parsing dari kolom **Kode Aset** (contoh format: `1.3.02.05.01.03.02.0001`).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Row Parser Preview */}
        {rows.length > 0 && !importSummary && !isImporting && (
          <div className="space-y-2 border rounded-lg overflow-hidden bg-white">
            <div className="bg-zinc-50 border-b px-3 py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Preview Data ({rows.length} Baris Terdeteksi)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Ready</span>
            </div>
            <div className="overflow-x-auto text-xs max-h-[220px]">
              <table className="min-w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-zinc-50 border-b text-zinc-500 font-semibold">
                    <th className="p-2 border-r sticky left-0 bg-zinc-50 z-10 min-w-[40px]">No</th>
                    {Object.keys(rows[0] || {}).map((header, idx) => (
                      <th key={idx} className="p-2 border-r whitespace-nowrap min-w-[120px]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {previewData.map((row: any, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="p-2 border-r text-zinc-400 font-sans sticky left-0 bg-white hover:bg-zinc-50 z-10">{idx + 1}</td>
                      {Object.keys(rows[0] || {}).map((header, hIdx) => {
                        const val = row[header];
                        let valStr = val !== undefined && val !== null ? String(val) : "-";
                        
                        // Format dynamic values nicely if they are numeric
                        if (header.toLowerCase() === "harga" && val !== undefined && val !== null) {
                          const num = Number(String(val).replace(/[^0-9.,]/g, ""));
                          if (!isNaN(num)) valStr = `Rp ${num.toLocaleString("id-ID")}`;
                        }
                        
                        return (
                          <td key={hIdx} className="p-2 border-r whitespace-nowrap truncate max-w-[200px]" title={valStr}>
                            {valStr}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress Bar Loader */}
        {isImporting && (
          <div className="space-y-3 p-4 bg-zinc-50 border rounded-lg text-center">
            <div className="flex justify-between text-xs font-semibold text-zinc-700">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                Sedang memproses seluruh data ({rows.length} baris)...
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full animate-pulse">
                Transaksi Database Aktif
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 relative overflow-hidden">
              <div className="bg-emerald-600 h-2 rounded-full absolute left-0 top-0 bottom-0 animate-pulse w-full" />
            </div>
            <p className="text-[10px] text-zinc-500 italic">
              Proses ini berjalan dalam satu transaksi aman database. Harap jangan menutup jendela browser Anda hingga selesai.
            </p>
          </div>
        )}

        {/* Final Import Summary Report */}
        {importSummary && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-emerald-250 bg-emerald-50/50 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Proses Import Selesai</h4>
                <div className="mt-1 space-y-1 text-xs text-emerald-800">
                  <p>
                    ✓ Berhasil menyimpan **{importSummary.successCount}** aset baru ke database.
                  </p>
                  {importSummary.skippedCount > 0 && (
                    <p className="text-zinc-600">
                      ⚠ Melewati **{importSummary.skippedCount}** baris data (duplikat / kesalahan format).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Duplicate assets warning list */}
            {importSummary.duplicates.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg border border-amber-250 bg-amber-50/30 text-xs">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                  Kode Aset Dilewati ({importSummary.duplicates.length} Duplikat di Database):
                </p>
                <div className="max-h-[90px] overflow-y-auto font-mono text-[10px] bg-white p-2 rounded-md border text-zinc-700 divide-y">
                  {importSummary.duplicates.map((code, idx) => (
                    <div key={idx} className="py-0.5">{code}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Error alerts logs list */}
            {importSummary.errors.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg border border-rose-250 bg-rose-50/30 text-xs">
                <p className="font-bold text-rose-900 flex items-center gap-1">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  Daftar Kesalahan Baris (Maksimal 50 ditampilkan):
                </p>
                <div className="max-h-[95px] overflow-y-auto font-sans text-[10px] bg-white p-2 rounded-md border text-rose-950 divide-y">
                  {importSummary.errors.map((err, idx) => (
                    <div key={idx} className="py-0.5">{err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        {!importSummary ? (
          <>
            <Button
              variant="outline"
              onClick={handleCloseWrapper}
              disabled={isImporting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={rows.length === 0 || !defaultDistId || isImporting || isParsing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Mulai Import
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCloseWrapper}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
          >
            Tutup
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
