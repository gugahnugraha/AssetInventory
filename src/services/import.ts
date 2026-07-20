import prisma from "./db";
import { Kondisi, Role, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { getRowValue } from "@/lib/utils";

export interface ExcelAssetRow {
  "Kode Aset"?: string | number;
  kode1?: string | number;
  kode2?: string | number;
  kode3?: string | number;
  kode4?: string | number;
  kode5?: string | number;
  "NomorRegister"?: string | number;
  "Nama Aset"?: string;
  "Merk/Type"?: string;
  "Spesifikasi"?: string;
  "Material"?: string;
  "Tahun"?: string | number;
  "Nomor Rangka"?: string;
  "Nomor Mesin"?: string;
  "Nomor Polisi"?: string;
  "Perolehan"?: string;
  "Harga"?: string | number;
  "Catatan"?: string;
  "KIB"?: string;
  "Kategori"?: string;
  "Bidang Distribusi"?: string;
}

export interface ImportResult {
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  duplicates: string[];
  errors: string[];
}

function cleanString(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

function parseKibCode(kibVal: string): string {
  const clean = kibVal.toUpperCase().trim();
  if (clean.startsWith("KIB ")) {
    return clean.replace("KIB ", "").substring(0, 1);
  }
  if (clean.includes("TANAH")) return "A";
  if (clean.includes("PERALATAN") || clean.includes("MESIN")) return "B";
  if (clean.includes("GEDUNG") || clean.includes("BANGUNAN")) return "C";
  if (clean.includes("JALAN") || clean.includes("IRIGASI") || clean.includes("JARINGAN")) return "D";
  if (clean.includes("LAINNYA") || clean.includes("TETAP LAIN")) return "E";
  if (clean.includes("KONSTRUKSI") || clean.includes("PENGERJAAN")) return "F";
  
  // Try taking first character if it is between A and F
  const firstChar = clean.charAt(0);
  if (["A", "B", "C", "D", "E", "F"].includes(firstChar)) {
    return firstChar;
  }
  return "B"; // default fallback
}

function getCategoryNameForKibB(namaAset: string, hasVehicleInfo: boolean): string {
  if (hasVehicleInfo) return "Kendaraan";
  const name = namaAset.toLowerCase();
  if (
    name.includes("mobil") ||
    name.includes("motor") ||
    name.includes("bus") ||
    name.includes("truk") ||
    name.includes("kendaraan") ||
    name.includes("sepeda") ||
    name.includes("ambulan")
  ) {
    return "Kendaraan";
  }
  if (
    name.includes("laptop") ||
    name.includes("komputer") ||
    name.includes("pc") ||
    name.includes("notebook") ||
    name.includes("printer") ||
    name.includes("scanner") ||
    name.includes("proyektor") ||
    name.includes("ups") ||
    name.includes("tablet") ||
    name.includes("ipad")
  ) {
    return "Peralatan Elektronik";
  }
  if (
    name.includes("meja") ||
    name.includes("kursi") ||
    name.includes("lemari") ||
    name.includes("rak") ||
    name.includes("sofa") ||
    name.includes("laci") ||
    name.includes("filing") ||
    name.includes("cabinet") ||
    name.includes("bufet") ||
    name.includes("credenza") ||
    name.includes("meubel")
  ) {
    return "Furnitur";
  }
  if (
    name.includes("ac") ||
    name.includes("kipas") ||
    name.includes("kulkas") ||
    name.includes("dispenser") ||
    name.includes("tv") ||
    name.includes("televisi") ||
    name.includes("brankas") ||
    name.includes("cctv") ||
    name.includes("kamera") ||
    name.includes("papan tulis")
  ) {
    return "Peralatan Kantor";
  }
  if (
    name.includes("switch") ||
    name.includes("router") ||
    name.includes("hub") ||
    name.includes("access point") ||
    name.includes("server") ||
    name.includes("mikrotik") ||
    name.includes("wifi") ||
    name.includes("jaringan")
  ) {
    return "Peralatan Jaringan & IT";
  }
  return "Lainnya";
}

export async function importAssetsBatch(
  rows: ExcelAssetRow[],
  opdId: string,
  defaultDistributionId: string,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    successCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    duplicates: [],
    errors: [],
  };

  // We will prepare arrays for bulk inserts
  const assetsToInsert: Prisma.AssetCreateManyInput[] = [];
  const attributesToInsert: Prisma.AssetAttributeCreateManyInput[] = [];
  const auditLogsToInsert: Prisma.AuditLogCreateManyInput[] = [];

  // Run the ENTIRE import batch inside a single Prisma transaction with custom timeouts!
  await prisma.$transaction(async (tx) => {
    // 1. Preload master data: KIBs, Categories and their Attributes, and existing assets details
    const kibs = await tx.kib.findMany();
    const categories = await tx.category.findMany({
      include: { attributes: true },
    });
    const existingAssets = await tx.asset.findMany({
      select: {
        id: true,
        kodeLengkap: true,
        namaAset: true,
        harga: true,
        tahunPembelian: true,
        kondisi: true,
        distributionId: true,
      },
    });

    const initialExistingAssetMap = new Map<string, {
      id: string;
      namaAset: string;
      harga: number;
      tahunPembelian: number;
      kondisi: Kondisi;
      distributionId: string;
    }>();
    const existingCodes = new Set<string>();

    for (const a of existingAssets) {
      initialExistingAssetMap.set(a.kodeLengkap, {
        id: a.id,
        namaAset: a.namaAset,
        harga: a.harga,
        tahunPembelian: a.tahunPembelian,
        kondisi: a.kondisi,
        distributionId: a.distributionId,
      });
      existingCodes.add(a.kodeLengkap);
    }
    
    const distributions = await tx.distribution.findMany({
      where: { opdId }
    });

    const holders = await tx.holder.findMany({
      where: { distribution: { opdId } }
    });
    
    // In-memory cache to save newly created categories during this transaction
    const categoryCache = new Map<string, any>();
    for (const cat of categories) {
      categoryCache.set(`${cat.kibId}_${cat.nama.toLowerCase()}`, cat);
    }

    // First Pass: Resolve categories and prepare bulk insert/update data
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 1;

      const namaAset = cleanString(getRowValue(row, ["Nama Aset", "Nama Barang", "Nama", "Barang"]));
      if (!namaAset) {
        throw new Error(`Baris ${rowNum}: Nama Aset tidak boleh kosong.`);
      }

      // Parse KIB (Forced to KIB B as requested)
      const kib = kibs.find((k) => k.kode === "B");
      if (!kib) {
        throw new Error(`Baris ${rowNum}: KIB B tidak ditemukan.`);
      }

      // Parse sub-codes & register
      let kode1 = 0;
      let kode2 = 0;
      let kode3 = 0;
      let kode4 = 0;
      let kode5 = 0;
      let nomorRegister = 1;

      const rawKodeAset = cleanString(getRowValue(row, ["Kode Aset", "Kode Barang", "Kode"]));
      const rawNomorRegister = getRowValue(row, ["NomorRegister", "Nomor Register", "No Register", "Register", "NoReg"]);
      let parsedFromCodeString = false;

      if (rawKodeAset) {
        const parts = rawKodeAset.split(".").map((p) => p.trim());
        if (parts.length === 8) {
          kode1 = parseInt(parts[2], 10) || 0;
          kode2 = parseInt(parts[3], 10) || 0;
          kode3 = parseInt(parts[4], 10) || 0;
          kode4 = parseInt(parts[5], 10) || 0;
          kode5 = parseInt(parts[6], 10) || 0;
          nomorRegister = parseInt(parts[7], 10) || 1;
          parsedFromCodeString = true;
        } else if (parts.length === 7) {
          kode1 = parseInt(parts[2], 10) || 0;
          kode2 = parseInt(parts[3], 10) || 0;
          kode3 = parseInt(parts[4], 10) || 0;
          kode4 = parseInt(parts[5], 10) || 0;
          kode5 = parseInt(parts[6], 10) || 0;
          nomorRegister = parseInt(cleanString(rawNomorRegister), 10) || 1;
          parsedFromCodeString = true;
        } else if (parts.length === 6) {
          kode1 = parseInt(parts[0], 10) || 0;
          kode2 = parseInt(parts[1], 10) || 0;
          kode3 = parseInt(parts[2], 10) || 0;
          kode4 = parseInt(parts[3], 10) || 0;
          kode5 = parseInt(parts[4], 10) || 0;
          nomorRegister = parseInt(parts[5], 10) || 1;
          parsedFromCodeString = true;
        } else if (parts.length === 5) {
          kode1 = parseInt(parts[0], 10) || 0;
          kode2 = parseInt(parts[1], 10) || 0;
          kode3 = parseInt(parts[2], 10) || 0;
          kode4 = parseInt(parts[3], 10) || 0;
          kode5 = parseInt(parts[4], 10) || 0;
          nomorRegister = parseInt(cleanString(rawNomorRegister), 10) || 1;
          parsedFromCodeString = true;
        }
      }

      if (!parsedFromCodeString) {
        kode1 = parseInt(cleanString(getRowValue(row, ["kode1"])), 10) || 0;
        kode2 = parseInt(cleanString(getRowValue(row, ["kode2"])), 10) || 0;
        kode3 = parseInt(cleanString(getRowValue(row, ["kode3"])), 10) || 0;
        kode4 = parseInt(cleanString(getRowValue(row, ["kode4"])), 10) || 0;
        kode5 = parseInt(cleanString(getRowValue(row, ["kode5"])), 10) || 0;
        nomorRegister = parseInt(cleanString(rawNomorRegister), 10) || 1;
      }

      // Reconstruct complete unique code string (pad to strings for unique kodeLengkap)
      const k1Str = String(kode1).padStart(2, "0");
      const k2Str = String(kode2).padStart(2, "0");
      const k3Str = String(kode3).padStart(2, "0");
      const k4Str = String(kode4).padStart(2, "0");
      const k5Str = String(kode5).padStart(3, "0");
      
      const baseKode = `1.3.${k1Str}.${k2Str}.${k3Str}.${k4Str}.${k5Str}`;
      let registerStr = String(nomorRegister).padStart(4, "0");
      let kodeLengkap = `${baseKode}.${registerStr}`;

      // Check if it's an update to an existing database record
      let isUpdate = false;
      let existingAssetId: string | null = null;
      let existingAssetData: any = null;

      if (initialExistingAssetMap.has(kodeLengkap)) {
        isUpdate = true;
        existingAssetData = initialExistingAssetMap.get(kodeLengkap);
        existingAssetId = existingAssetData.id;
      } else {
        // Auto-fix duplicates: If duplicate exists in other new rows, find next available register
        if (existingCodes.has(kodeLengkap)) {
          let nextReg = nomorRegister + 1;
          while (existingCodes.has(`${baseKode}.${String(nextReg).padStart(4, "0")}`)) {
            nextReg++;
          }
          nomorRegister = nextReg;
          registerStr = String(nomorRegister).padStart(4, "0");
          kodeLengkap = `${baseKode}.${registerStr}`;
        }
      }

      // Parse optional attributes
      const noRangka = cleanString(getRowValue(row, ["Nomor Rangka", "No Rangka", "No. Rangka", "Norangka", "No.Rangka"]));
      const noMesin = cleanString(getRowValue(row, ["Nomor Mesin", "No Mesin", "No. Mesin", "Nomesin", "No.Mesin"]));
      const rawNoPolisi = getRowValue(row, ["Nomor Polisi", "No Polisi", "No. Polisi", "Nopol", "No.Polisi", "NomorPolisi"]);
      const noPolisi = cleanString(rawNoPolisi).replace(/\s+/g, "").toUpperCase();
      const hasVehicleInfo = !!(noRangka || noMesin || noPolisi);

      // Determine category name
      let targetCategoryName = "Lainnya";
      const kategoriInput = cleanString(getRowValue(row, ["Kategori", "Kategori Aset", "Golongan", "Kelompok"]));
      
      if (kategoriInput) {
        targetCategoryName = kategoriInput;
      } else if (kib.kode === "B") {
        targetCategoryName = getCategoryNameForKibB(namaAset, hasVehicleInfo);
      } else {
        targetCategoryName = kib.nama;
      }

      // Find or dynamically create Category if not present in cache/db
      const cacheKey = `${kib.id}_${targetCategoryName.toLowerCase()}`;
      let category = categoryCache.get(cacheKey);

      if (!category) {
        // Create the category dynamically in database
        category = await tx.category.create({
          data: {
            nama: targetCategoryName,
            kibId: kib.id,
          },
          include: { attributes: true },
        });
        categoryCache.set(cacheKey, category);

        // Seed default attributes if creating Kendaraan
        if (targetCategoryName === "Kendaraan") {
          const attrs = [
            { nama: "Nomor Polisi", displayOrder: 1 },
            { nama: "Nomor Mesin", displayOrder: 2 },
            { nama: "Nomor Rangka", displayOrder: 3 },
          ];
          const createdAttrs = [];
          for (const item of attrs) {
            const ca = await tx.categoryAttribute.create({
              data: {
                categoryId: category.id,
                nama: item.nama,
                required: true,
                fieldType: "TEXT",
                displayOrder: item.displayOrder,
              },
            });
            createdAttrs.push(ca);
          }
          category.attributes = createdAttrs;
        }
      }

      // Parse other standard values with flexible header aliases
      const merkType = cleanString(getRowValue(row, [
        "Merk/Type", "Merk / Type", "Merk/Tipe", "Merk / Tipe", "Merk", "Type", "Tipe", "Merk Type", "Merk Tipe"
      ])) || "-";

      const spesifikasi = cleanString(getRowValue(row, [
        "Spesifikasi", "Spesifikasi Aset", "Spesifikasi Teknis", "Deskripsi", "Spesifikasi Barang", "Spesifikasi/Type"
      ])) || null;

      const material = cleanString(getRowValue(row, [
        "Material", "Material / Bahan", "Material/Bahan", "Bahan"
      ])) || null;

      const catatan = cleanString(getRowValue(row, [
        "Catatan", "Catatan Tambahan", "Keterangan"
      ])) || null;

      const caraPerolehan = cleanString(getRowValue(row, [
        "Cara Perolehan", "Perolehan", "CaraPerolehan", "Asal Usul", "Asal Usul / Cara Perolehan", "Asal-Usul / Cara Perolehan", "Asal Usul Perolehan", "Asal/Cara Perolehan", "Asal Usul/Cara Perolehan", "Cara Pembuatan / Perolehan", "Cara Pembuatan/Perolehan", "Perolehan Aset", "Cara Obtention"
      ])) || null;

      // Harga
      let harga = 0;
      const rawHarga = getRowValue(row, [
        "Harga", "Harga Perolehan", "Nilai Perolehan", "Harga (Rp)", "Harga Perolehan (Rp)", "Nilai Buku", "Harga Satuan"
      ]);
      if (rawHarga !== undefined && rawHarga !== null && rawHarga !== "") {
        const cleanHargaStr = String(rawHarga).replace(/[^0-9.,]/g, "").replace(/,/g, ".");
        harga = parseFloat(cleanHargaStr) || 0;
      }

      // Tahun Pembelian
      let tahunPembelian = new Date().getFullYear();
      const rawTahun = getRowValue(row, [
        "Tahun", "Tahun Perolehan", "Tahun Pembelian", "Tahun Pembuatan", "Tahun Perolehan/Pembelian", "TahunPerolehan"
      ]);
      if (rawTahun !== undefined && rawTahun !== null && rawTahun !== "") {
        tahunPembelian = parseInt(String(rawTahun).replace(/\D/g, ""), 10) || tahunPembelian;
      }

      // Bidang Distribusi
      let rowDistributionId = defaultDistributionId;
      const bidangInput = cleanString(getRowValue(row, [
        "Bidang Distribusi", "Bidang", "Distribusi", "Unit Kerja", "Unit", "Bidang Kerja", "Lokasi", "Bidang/Unit"
      ]));

      if (bidangInput) {
        const bLower = bidangInput.toLowerCase().trim();
        const match = distributions.find(d => {
          const dLower = d.nama.toLowerCase().trim();
          return dLower === bLower || bLower.includes(dLower) || dLower.includes(bLower);
        });
        if (match) {
          rowDistributionId = match.id;
        }
      } else if (isUpdate && existingAssetData) {
        rowDistributionId = existingAssetData.distributionId;
      } else {
        const matchSekretariat = distributions.find(d => d.nama.toLowerCase() === "sekretariat");
        if (matchSekretariat) {
          rowDistributionId = matchSekretariat.id;
        }
      }

      // Pemegang Barang (Holder) — Auto-match existing or dynamically create new Holder if not found
      let rowHolderId: string | null = null;
      const holderInput = cleanString(getRowValue(row, [
        "Pemegang Barang", "Pemegang Aset", "Pemegang", "Nama Pemegang", "PJB", "Penanggung Jawab", "Pemegang/PJB", "Nama PJB", "NIP Pemegang", "NIP"
      ]));

      const isInvalidHolderName = (name: string) => {
        const s = name.trim().toLowerCase();
        return !s || s === "-" || s === "--" || s === "---" || s === "tidak ada" || s === "kosong" || s === "n/a" || s === "none";
      };

      if (holderInput && !isInvalidHolderName(holderInput)) {
        const cleanDigits = holderInput.replace(/\D/g, "");
        let matchHolder: any = null;

        if (cleanDigits.length >= 5) {
          matchHolder = holders.find(h => h.nip.includes(cleanDigits) || cleanDigits.includes(h.nip));
        }

        if (!matchHolder) {
          const inputLower = holderInput.toLowerCase();
          matchHolder = holders.find(h => {
            const hNameLower = h.nama.toLowerCase();
            return hNameLower === inputLower || inputLower.includes(hNameLower) || hNameLower.includes(inputLower);
          });
        }

        if (matchHolder) {
          rowHolderId = matchHolder.id;
          if (!bidangInput && matchHolder.distributionId) {
            rowDistributionId = matchHolder.distributionId;
          }
        } else {
          // Dynamic Auto-Creation of Holder in DB if not found in Master Data
          const newHolder = await tx.holder.create({
            data: {
              id: randomUUID(),
              nama: holderInput,
              nip: `- AUTO-${randomUUID().substring(0, 8).toUpperCase()}`,
              jabatan: "-",
              distributionId: rowDistributionId,
            },
          });
          holders.push(newHolder); // Add to cache for subsequent rows in this batch
          rowHolderId = newHolder.id;
        }
      }

      if (isUpdate && existingAssetId && existingAssetData) {
        // Perform UPDATE immediately
        await tx.asset.update({
          where: { id: existingAssetId },
          data: {
            categoryId: category.id,
            namaAset,
            merkType,
            material,
            caraPerolehan,
            spesifikasi,
            harga,
            tahunPembelian,
            distributionId: rowDistributionId,
            holderId: rowHolderId !== null ? rowHolderId : undefined,
            catatan,
            opdId,
          },
        });

        // Update Vehicle Attributes if it is a vehicle
        if (category.nama === "Kendaraan" && hasVehicleInfo) {
          const attrMap = new Map<string, string>();
          if (noPolisi) attrMap.set("Nomor Polisi", noPolisi);
          if (noMesin) attrMap.set("Nomor Mesin", noMesin);
          if (noRangka) attrMap.set("Nomor Rangka", noRangka);

          for (const [name, val] of attrMap.entries()) {
            const catAttr = category.attributes.find((a: any) => a.nama === name);
            if (catAttr) {
              await tx.assetAttribute.upsert({
                where: {
                  assetId_categoryAttributeId: {
                    assetId: existingAssetId,
                    categoryAttributeId: catAttr.id,
                  },
                },
                update: { value: val },
                create: {
                  id: randomUUID(),
                  assetId: existingAssetId,
                  categoryAttributeId: catAttr.id,
                  value: val,
                },
              });
            }
          }
        }

        // Write Audit Log for UPDATE
        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            userId,
            assetId: existingAssetId,
            action: "UPDATE",
            oldValue: JSON.stringify({
              namaAset: existingAssetData.namaAset,
              harga: existingAssetData.harga,
              tahunPembelian: existingAssetData.tahunPembelian,
              kondisi: existingAssetData.kondisi,
            }),
            newValue: JSON.stringify({
              namaAset,
              harga,
              tahunPembelian,
              kondisi: existingAssetData.kondisi,
            }),
          },
        });

        result.updatedCount++;
      } else {
        // Perform INSERT (prepare for bulk insert)
        const assetId = randomUUID();

        assetsToInsert.push({
          id: assetId,
          kode1,
          kode2,
          kode3,
          kode4,
          kode5,
          nomorRegister,
          kodeLengkap,
          categoryId: category.id,
          namaAset,
          merkType,
          material,
          caraPerolehan,
          spesifikasi,
          harga,
          tahunPembelian,
          distributionId: rowDistributionId,
          holderId: rowHolderId,
          kondisi: Kondisi.NORMAL,
          catatan,
          opdId,
        });

        // Insert Vehicle Attributes if it is a vehicle
        if (category.nama === "Kendaraan" && hasVehicleInfo) {
          const attrMap = new Map<string, string>();
          if (noPolisi) attrMap.set("Nomor Polisi", noPolisi);
          if (noMesin) attrMap.set("Nomor Mesin", noMesin);
          if (noRangka) attrMap.set("Nomor Rangka", noRangka);

          for (const [name, val] of attrMap.entries()) {
            const catAttr = category.attributes.find((a: any) => a.nama === name);
            if (catAttr) {
              attributesToInsert.push({
                id: randomUUID(),
                assetId,
                categoryAttributeId: catAttr.id,
                value: val,
              });
            }
          }
        }

        // Write Audit Log for CREATE
        auditLogsToInsert.push({
          id: randomUUID(),
          userId,
          assetId,
          action: "CREATE",
          newValue: JSON.stringify({
            namaAset,
            kodeLengkap,
            harga,
            tahunPembelian,
            kondisi: Kondisi.NORMAL,
          }),
        });

        existingCodes.add(kodeLengkap);
        result.successCount++;
      }
    }

    // Second Pass: Bulk Inserts for new assets
    if (assetsToInsert.length > 0) {
      const chunkSize = 1000;
      for (let i = 0; i < assetsToInsert.length; i += chunkSize) {
        await tx.asset.createMany({
          data: assetsToInsert.slice(i, i + chunkSize),
        });
      }
    }

    if (attributesToInsert.length > 0) {
      const chunkSize = 2000;
      for (let i = 0; i < attributesToInsert.length; i += chunkSize) {
        await tx.assetAttribute.createMany({
          data: attributesToInsert.slice(i, i + chunkSize),
        });
      }
    }

    if (auditLogsToInsert.length > 0) {
      const chunkSize = 2000;
      for (let i = 0; i < auditLogsToInsert.length; i += chunkSize) {
        await tx.auditLog.createMany({
          data: auditLogsToInsert.slice(i, i + chunkSize),
        });
      }
    }

  }, {
    maxWait: 15000,
    timeout: 120000, // 2 minutes just to be super safe
  });

  return result;
}
