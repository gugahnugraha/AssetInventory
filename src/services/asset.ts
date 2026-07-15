import prisma from "./db";
import { Kondisi, Prisma, EntityType, DocumentType } from "@prisma/client";
import { createAuditLog } from "./auditLog";
import { DocumentService } from "./document";

export interface AssetFilterInput {
  search?: string;
  kondisi?: string;
  distributionId?: string;
  kibId?: string;
  categoryId?: string;
}

export async function getAllAssets(opdId: string, filters?: AssetFilterInput) {
  try {
    const where: Prisma.AssetWhereInput = { opdId };

    if (filters) {
      const { search, kondisi, distributionId, kibId, categoryId } = filters;

      if (kondisi) {
        where.kondisi = kondisi as Kondisi;
      }

      if (distributionId) {
        where.distributionId = distributionId;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      } else if (kibId) {
        where.category = { kibId };
      }

      if (search) {
        const searchConditions: Prisma.AssetWhereInput[] = [
          { kodeLengkap: { contains: search, mode: "insensitive" } },
          { namaAset: { contains: search, mode: "insensitive" } },
          { merkType: { contains: search, mode: "insensitive" } },
          { category: { nama: { contains: search, mode: "insensitive" } } },
          { category: { kib: { nama: { contains: search, mode: "insensitive" } } } },
          { category: { kib: { kode: { contains: search, mode: "insensitive" } } } },
          { distribution: { nama: { contains: search, mode: "insensitive" } } },
          { holder: { nama: { contains: search, mode: "insensitive" } } },
          {
            attributes: {
              some: {
                OR: [
                  { value: { contains: search, mode: "insensitive" } },
                  { categoryAttribute: { nama: { contains: search, mode: "insensitive" } } }
                ]
              }
            }
          }
        ];

        const regNum = parseInt(search);
        if (!isNaN(regNum)) {
          searchConditions.push({ nomorRegister: regNum });
        }

        // Add year search if it looks like a year
        const yearNum = parseInt(search);
        if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
          searchConditions.push({ tahunPembelian: yearNum });
        }

        where.OR = searchConditions;
      }
    }

    return await prisma.asset.findMany({
      where,
      include: {
        category: {
          include: {
            kib: true
          }
        },
        distribution: true,
        holder: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        },
        reconciliations: {
          include: {
            period: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw new Error(`Gagal mengambil data aset: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getAssetById(id: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            kib: true
          }
        },
        distribution: true,
        holder: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        },
        auditLogs: {
          include: {
            user: {
              select: {
                nama: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        history: {
          include: {
            fromDistribution: true,
            toDistribution: true,
            fromHolder: true,
            toHolder: true,
            creator: {
              select: {
                nama: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!asset) return null;

    // Fetch photos polymorphic
    const photos = await prisma.document.findMany({
      where: {
        entityId: id,
        entityType: "ASSET",
        documentType: "PHOTO",
        archivedAt: null,
      },
      orderBy: { uploadedAt: "desc" },
    });

    // Fetch documents for each history entry
    const historyWithDocs = await Promise.all(
      asset.history.map(async (h) => {
        const docs = await prisma.document.findMany({
          where: {
            entityId: h.id,
            entityType: "MUTATION",
            archivedAt: null,
          },
        });
        return {
          ...h,
          documents: docs,
        };
      })
    );

    return {
      ...asset,
      photos,
      history: historyWithDocs,
    };
  } catch (error) {
    console.error("Error in getAssetById:", error);
    throw new Error("Gagal mengambil data detail aset");
  }
}

export interface CreateAssetInput {
  kode1: string;
  kode2: string;
  kode3: string;
  kode4: string;
  kode5: string;
  nomorRegister: string;
  categoryId: string;
  namaAset: string;
  merkType: string;
  material?: string | null;
  caraPerolehan?: string | null;
  spesifikasi?: string | null;
  harga: number;
  tahunPembelian: number;
  distributionId: string;
  holderId?: string | null;
  kondisi: Kondisi;
  catatan?: string | null;
  fotoUtama?: string | null;
  opdId: string;
  photos?: { tempKey: string; originalFileName: string; mimeType: string; size: number; isPrimary: boolean }[];
  dynamicAttributes?: Record<string, string>;
}

export async function createAsset(data: CreateAssetInput, userId: string) {
  let committedKeys: string[] = [];
  try {
    const registerInt = parseInt(data.nomorRegister, 10);
    if (isNaN(registerInt)) {
      throw new Error("Nomor register harus berupa angka/integer.");
    }
    const registerStr = String(registerInt).padStart(4, '0');

    const k1 = parseInt(data.kode1, 10);
    const k2 = parseInt(data.kode2, 10);
    const k3 = parseInt(data.kode3, 10);
    const k4 = parseInt(data.kode4, 10);
    const k5 = parseInt(data.kode5, 10);

    if (isNaN(k1) || isNaN(k2) || isNaN(k3) || isNaN(k4) || isNaN(k5)) {
      throw new Error("Kode klasifikasi aset harus berupa angka/integer.");
    }

    const k1Str = String(k1).padStart(2, '0');
    const k2Str = String(k2).padStart(2, '0');
    const k3Str = String(k3).padStart(2, '0');
    const k4Str = String(k4).padStart(2, '0');
    const k5Str = String(k5).padStart(3, '0');
    const kodeLengkap = `1.3.${k1Str}.${k2Str}.${k3Str}.${k4Str}.${k5Str}.${registerStr}`;

    // Verify uniqueness of full code
    const existing = await prisma.asset.findUnique({
      where: { kodeLengkap },
    });

    if (existing) {
      throw new Error(`Aset dengan kode lengkap ${kodeLengkap} sudah terdaftar.`);
    }

    const createdAsset = await prisma.$transaction(async (tx) => {
      // 1. Create the Asset
      const asset = await tx.asset.create({
        data: {
          kode1: k1,
          kode2: k2,
          kode3: k3,
          kode4: k4,
          kode5: k5,
          nomorRegister: registerInt,
          kodeLengkap,
          categoryId: data.categoryId,
          namaAset: data.namaAset,
          merkType: data.merkType,
          material: data.material || null,
          caraPerolehan: data.caraPerolehan || null,
          spesifikasi: data.spesifikasi || null,
          harga: data.harga,
          tahunPembelian: data.tahunPembelian,
          distributionId: data.distributionId,
          holderId: data.holderId || null,
          kondisi: data.kondisi,
          catatan: data.catatan,
          fotoUtama: null, // will be updated if primary photo exists
          opdId: data.opdId,
        },
      });

      // 2. Commit photos in R2 & DB Document
      if (data.photos && data.photos.length > 0) {
        for (const p of data.photos) {
          if (p.isPrimary) {
            const targetKey = DocumentService.generateObjectKey(asset.id, "PRIMARY");
            await DocumentService.commitPrimaryPhoto(p.tempKey, asset.id, userId, {
              originalFileName: p.originalFileName,
              mimeType: p.mimeType,
              size: p.size,
            }, tx);
            committedKeys.push(targetKey);
          } else {
            const doc = await DocumentService.commitDetailPhoto(p.tempKey, asset.id, userId, {
              originalFileName: p.originalFileName,
              mimeType: p.mimeType,
              size: p.size,
            }, tx);
            committedKeys.push(doc.objectKey);
          }
        }
      }

      // 3. Create Dynamic Attributes
      if (data.dynamicAttributes) {
        const attrData = Object.entries(data.dynamicAttributes)
          .filter(([_, val]) => val !== undefined && val !== null && val.trim() !== "")
          .map(([attrId, val]) => ({
            assetId: asset.id,
            categoryAttributeId: attrId,
            value: val.trim()
          }));
        if (attrData.length > 0) {
          await tx.assetAttribute.createMany({
            data: attrData
          });
        }
      }

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          assetId: asset.id,
          action: "CREATE",
          newValue: JSON.stringify(asset),
        },
      });

      return asset;
    });

    return createdAsset;
  } catch (error: any) {
    console.error("Error in createAsset:", error);
    // Cleanup committed R2 files if transaction fails
    for (const key of committedKeys) {
      await DocumentService.deleteFromR2(key);
    }
    throw new Error(error.message || "Gagal membuat data aset baru");
  }
}

export interface UpdateAssetInput {
  kode1?: string;
  kode2?: string;
  kode3?: string;
  kode4?: string;
  kode5?: string;
  nomorRegister?: string;
  categoryId?: string;
  namaAset?: string;
  merkType?: string;
  material?: string | null;
  caraPerolehan?: string | null;
  spesifikasi?: string | null;
  harga?: number;
  tahunPembelian?: number;
  distributionId?: string;
  holderId?: string | null;
  kondisi?: Kondisi;
  catatan?: string | null;
  fotoUtama?: string | null;
  photos?: { tempKey: string; originalFileName: string; mimeType: string; size: number; isPrimary: boolean }[];
  deletePhotoIds?: string[];
  dynamicAttributes?: Record<string, string>;
}

export async function updateAsset(id: string, data: UpdateAssetInput, userId: string) {
  let committedKeys: string[] = [];
  try {
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      throw new Error("Aset tidak ditemukan.");
    }

    // Recompute complete code if parts are updated
    let kodeLengkap = existingAsset.kodeLengkap;
    const k1 = data.kode1 !== undefined ? parseInt(data.kode1, 10) : existingAsset.kode1;
    const k2 = data.kode2 !== undefined ? parseInt(data.kode2, 10) : existingAsset.kode2;
    const k3 = data.kode3 !== undefined ? parseInt(data.kode3, 10) : existingAsset.kode3;
    const k4 = data.kode4 !== undefined ? parseInt(data.kode4, 10) : existingAsset.kode4;
    const k5 = data.kode5 !== undefined ? parseInt(data.kode5, 10) : existingAsset.kode5;
    const regInt = data.nomorRegister !== undefined ? parseInt(data.nomorRegister, 10) : existingAsset.nomorRegister;
    
    const regStr = String(regInt).padStart(4, '0');
    const k1Str = String(k1).padStart(2, '0');
    const k2Str = String(k2).padStart(2, '0');
    const k3Str = String(k3).padStart(2, '0');
    const k4Str = String(k4).padStart(2, '0');
    const k5Str = String(k5).padStart(3, '0');
    const newKodeLengkap = `1.3.${k1Str}.${k2Str}.${k3Str}.${k4Str}.${k5Str}.${regStr}`;

    if (newKodeLengkap !== existingAsset.kodeLengkap) {
      // Verify uniqueness of the new full code
      const doubleCode = await prisma.asset.findUnique({
        where: { kodeLengkap: newKodeLengkap },
      });
      if (doubleCode) {
        throw new Error(`Aset dengan kode lengkap ${newKodeLengkap} sudah terdaftar.`);
      }
      kodeLengkap = newKodeLengkap;
    }

    const updatedAsset = await prisma.$transaction(async (tx) => {
      // 1. Process deletePhotoIds
      if (data.deletePhotoIds && data.deletePhotoIds.length > 0) {
        for (const docId of data.deletePhotoIds) {
          await DocumentService.deletePhoto(docId, userId, tx);
        }
      }

      // Fetch active photos to find the photo index and old primary photo
      const activeDocs = await tx.document.findMany({
        where: {
          entityId: id,
          entityType: EntityType.ASSET,
          documentType: DocumentType.PHOTO,
          archivedAt: null,
        },
      });

      // 2. Commit new photos
      let primaryKey: string | null = existingAsset.fotoUtama;
      
      if (data.photos && data.photos.length > 0) {
        for (const p of data.photos) {
          if (p.isPrimary) {
            const targetKey = DocumentService.generateObjectKey(id, "PRIMARY");
            await DocumentService.commitPrimaryPhoto(p.tempKey, id, userId, {
              originalFileName: p.originalFileName,
              mimeType: p.mimeType,
              size: p.size,
            }, tx);
            committedKeys.push(targetKey);
            primaryKey = targetKey;
          } else {
            const doc = await DocumentService.commitDetailPhoto(p.tempKey, id, userId, {
              originalFileName: p.originalFileName,
              mimeType: p.mimeType,
              size: p.size,
            }, tx);
            committedKeys.push(doc.objectKey);
          }
        }
      }

      // If the current primary photo was deleted and not replaced, set primaryKey to null
      if (data.deletePhotoIds && data.deletePhotoIds.length > 0 && primaryKey) {
        const activeDocsAfterDelete = await tx.document.findMany({
          where: {
            entityId: id,
            entityType: EntityType.ASSET,
            documentType: DocumentType.PHOTO,
            archivedAt: null,
          },
        });
        const primaryDoc = activeDocsAfterDelete.find(d => d.isPrimary);
        if (!primaryDoc) {
          primaryKey = null;
        }
      }

      // 3. Perform the asset update
      const asset = await tx.asset.update({
        where: { id },
        data: {
          kode1: data.kode1 !== undefined ? parseInt(data.kode1, 10) : undefined,
          kode2: data.kode2 !== undefined ? parseInt(data.kode2, 10) : undefined,
          kode3: data.kode3 !== undefined ? parseInt(data.kode3, 10) : undefined,
          kode4: data.kode4 !== undefined ? parseInt(data.kode4, 10) : undefined,
          kode5: data.kode5 !== undefined ? parseInt(data.kode5, 10) : undefined,
          nomorRegister: data.nomorRegister !== undefined ? parseInt(data.nomorRegister, 10) : undefined,
          kodeLengkap,
          categoryId: data.categoryId,
          namaAset: data.namaAset,
          merkType: data.merkType,
          material: data.material,
          caraPerolehan: data.caraPerolehan,
          spesifikasi: data.spesifikasi,
          harga: data.harga,
          tahunPembelian: data.tahunPembelian,
          distributionId: data.distributionId,
          holderId: data.holderId !== undefined ? data.holderId : undefined,
          kondisi: data.kondisi,
          catatan: data.catatan,
          fotoUtama: primaryKey,
        },
      });

      // 4. Update Dynamic Attributes
      if (data.dynamicAttributes) {
        await tx.assetAttribute.deleteMany({
          where: { assetId: id }
        });
        const attrData = Object.entries(data.dynamicAttributes)
          .filter(([_, val]) => val !== undefined && val !== null && val.trim() !== "")
          .map(([attrId, val]) => ({
            assetId: id,
            categoryAttributeId: attrId,
            value: val.trim()
          }));
        if (attrData.length > 0) {
          await tx.assetAttribute.createMany({
            data: attrData
          });
        }
      }

      // 5. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          assetId: id,
          action: "UPDATE",
          oldValue: JSON.stringify(existingAsset),
          newValue: JSON.stringify(asset),
        },
      });

      return asset;
    });

    return updatedAsset;
  } catch (error: any) {
    console.error("Error in updateAsset:", error);
    // Cleanup committed R2 files if transaction fails
    for (const key of committedKeys) {
      await DocumentService.deleteFromR2(key);
    }
    throw new Error(error.message || "Gagal memperbarui data aset");
  }
}

export async function deleteAsset(id: string, userId: string) {
  try {
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      throw new Error("Aset tidak ditemukan.");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create audit log for deletion (since we cascade delete, log must be generated first or hold data)
      await tx.auditLog.create({
        data: {
          userId,
          assetId: id,
          action: "DELETE",
          oldValue: JSON.stringify(existingAsset),
        },
      });

      // 2. Delete Asset
      return await tx.asset.delete({
        where: { id },
      });
    });
  } catch (error: any) {
    console.error("Error in deleteAsset:", error);
    throw new Error(error.message || "Gagal menghapus aset");
  }
}

export async function getDashboardStats(opdId: string) {
  try {
    // Total assets
    const total = await prisma.asset.count({ where: { opdId } });

    // Total value of assets
    const totalValueResult = await prisma.asset.aggregate({
      where: { opdId },
      _sum: {
        harga: true
      }
    });
    const totalValue = totalValueResult._sum.harga || 0;

    // Breakdowns by condition
    const condiciones = [
      { name: "normal", val: Kondisi.NORMAL },
      { name: "rusakRingan", val: Kondisi.RUSAK_RINGAN },
      { name: "rusakBerat", val: Kondisi.RUSAK_BERAT },
      { name: "hilang", val: Kondisi.HILANG },
      { name: "perbaikan", val: Kondisi.DALAM_PERBAIKAN },
      { name: "dipinjam", val: Kondisi.DIPINJAM }
    ];
    const counts = await Promise.all(condiciones.map(c => 
      prisma.asset.count({ where: { opdId, kondisi: c.val } })
    ));
    const [normal, rusakRingan, rusakBerat, hilang, perbaikan, dipinjam] = counts;

    // Asset per distribution
    const assetsByDist = await prisma.distribution.findMany({
      where: { opdId },
      select: {
        nama: true,
        _count: {
          select: { assets: true },
        },
      },
    });

    const distChartData = assetsByDist.map(item => ({
      name: item.nama,
      total: item._count.assets,
    }));

    // Asset per namaAset (Top 5 + Others)
    const assetsByNama = await prisma.asset.groupBy({
      by: ["namaAset"],
      where: { opdId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const jenisChartData = assetsByNama.map(item => ({
      name: item.namaAset,
      total: item._count.id,
    }));

    // Latest assets
    const latestAssets = await prisma.asset.findMany({
      where: { opdId },
      include: {
        distribution: true,
        holder: true,
        category: {
          include: {
            kib: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Asset per KIB
    const kibList = await prisma.kib.findMany({
      include: {
        categories: {
          include: {
            _count: {
              select: { assets: { where: { opdId } } }
            }
          }
        }
      }
    });

    const kibChartData = kibList.map(k => {
      let totalAssets = 0;
      k.categories.forEach(c => {
        totalAssets += c._count.assets;
      });
      return {
        name: `KIB ${k.kode} (${k.nama})`,
        kode: k.kode,
        value: totalAssets
      };
    });

    return {
      metrics: {
        total,
        normal,
        rusakRingan,
        rusakBerat,
        hilang,
        perbaikan,
        dipinjam,
        totalValue,
      },
      charts: {
        byDistribution: distChartData,
        byType: jenisChartData,
        byKib: kibChartData,
      },
      latestAssets,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    throw new Error("Gagal mengambil data statistik dashboard");
  }
}
