import prisma from "./db";
import { Kondisi, Prisma } from "@prisma/client";
import { createAuditLog } from "./auditLog";

export interface AssetFilterInput {
  search?: string;
  kondisi?: string;
  distributionId?: string;
}

export async function getAllAssets(opdId: string, filters?: AssetFilterInput) {
  try {
    const where: Prisma.AssetWhereInput = { opdId };

    if (filters) {
      const { search, kondisi, distributionId } = filters;

      if (kondisi) {
        where.kondisi = kondisi as Kondisi;
      }

      if (distributionId) {
        where.distributionId = distributionId;
      }

      if (search) {
        const searchConditions: Prisma.AssetWhereInput[] = [
          { kodeLengkap: { contains: search, mode: "insensitive" } },
          { nomorRegister: { contains: search, mode: "insensitive" } },
          { namaAset: { contains: search, mode: "insensitive" } },
          { merkType: { contains: search, mode: "insensitive" } },
          { category: { nama: { contains: search, mode: "insensitive" } } },
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
        category: true,
        distribution: true,
        holder: true,
        photos: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error in getAllAssets:", error);
    throw new Error("Gagal mengambil data aset");
  }
}

export async function getAssetById(id: string) {
  try {
    return await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        distribution: true,
        holder: true,
        photos: true,
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
      },
    });
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
  harga: number;
  tahunPembelian: number;
  distributionId: string;
  holderId?: string | null;
  kondisi: Kondisi;
  catatan?: string | null;
  fotoUtama?: string | null;
  opdId: string;
  photos?: { url: string; caption?: string | null }[];
  dynamicAttributes?: Record<string, string>;
}

export async function createAsset(data: CreateAssetInput, userId: string) {
  try {
    const kodeLengkap = `01.03.${data.kode1}.${data.kode2}.${data.kode3}.${data.kode4}.${data.kode5}.${data.nomorRegister}`;

    // Verify uniqueness of full code
    const existing = await prisma.asset.findUnique({
      where: { kodeLengkap },
    });

    if (existing) {
      throw new Error(`Aset dengan kode lengkap ${kodeLengkap} sudah terdaftar.`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create the Asset
      const asset = await tx.asset.create({
        data: {
          kode1: data.kode1,
          kode2: data.kode2,
          kode3: data.kode3,
          kode4: data.kode4,
          kode5: data.kode5,
          nomorRegister: data.nomorRegister,
          kodeLengkap,
          categoryId: data.categoryId,
          namaAset: data.namaAset,
          merkType: data.merkType,
          harga: data.harga,
          tahunPembelian: data.tahunPembelian,
          distributionId: data.distributionId,
          holderId: data.holderId || null,
          kondisi: data.kondisi,
          catatan: data.catatan,
          fotoUtama: data.fotoUtama,
          opdId: data.opdId,
          photos: data.photos && data.photos.length > 0 
            ? { createMany: { data: data.photos } } 
            : undefined,
        },
      });

      // 2. Create Dynamic Attributes
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

      // 3. Create Audit Log
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
  } catch (error: any) {
    console.error("Error in createAsset:", error);
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
  harga?: number;
  tahunPembelian?: number;
  distributionId?: string;
  holderId?: string | null;
  kondisi?: Kondisi;
  catatan?: string | null;
  fotoUtama?: string | null;
  photos?: { url: string; caption?: string | null }[];
  dynamicAttributes?: Record<string, string>;
}

export async function updateAsset(id: string, data: UpdateAssetInput, userId: string) {
  try {
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!existingAsset) {
      throw new Error("Aset tidak ditemukan.");
    }

    // Recompute complete code if parts are updated
    let kodeLengkap = existingAsset.kodeLengkap;
    const k1 = data.kode1 !== undefined ? data.kode1 : existingAsset.kode1;
    const k2 = data.kode2 !== undefined ? data.kode2 : existingAsset.kode2;
    const k3 = data.kode3 !== undefined ? data.kode3 : existingAsset.kode3;
    const k4 = data.kode4 !== undefined ? data.kode4 : existingAsset.kode4;
    const k5 = data.kode5 !== undefined ? data.kode5 : existingAsset.kode5;
    const reg = data.nomorRegister !== undefined ? data.nomorRegister : existingAsset.nomorRegister;
    const newKodeLengkap = `01.03.${k1}.${k2}.${k3}.${k4}.${k5}.${reg}`;

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

    return await prisma.$transaction(async (tx) => {
      // 1. If photo arrays are provided, remove old and add new ones
      if (data.photos) {
        await tx.assetPhoto.deleteMany({
          where: { assetId: id },
        });
      }

      // 2. Perform the asset update
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          kode1: data.kode1,
          kode2: data.kode2,
          kode3: data.kode3,
          kode4: data.kode4,
          kode5: data.kode5,
          nomorRegister: data.nomorRegister,
          kodeLengkap,
          categoryId: data.categoryId,
          namaAset: data.namaAset,
          merkType: data.merkType,
          harga: data.harga,
          tahunPembelian: data.tahunPembelian,
          distributionId: data.distributionId,
          holderId: data.holderId === undefined ? undefined : data.holderId,
          kondisi: data.kondisi,
          catatan: data.catatan,
          fotoUtama: data.fotoUtama,
          photos: data.photos && data.photos.length > 0 
            ? { createMany: { data: data.photos } } 
            : undefined,
        },
      });

      // 3. Update Dynamic Attributes
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

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          assetId: id,
          action: "UPDATE",
          oldValue: JSON.stringify(existingAsset),
          newValue: JSON.stringify(updatedAsset),
        },
      });

      return updatedAsset;
    });
  } catch (error: any) {
    console.error("Error in updateAsset:", error);
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
      include: { distribution: true, holder: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 5,
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
      },
      latestAssets,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    throw new Error("Gagal mengambil data statistik dashboard");
  }
}
