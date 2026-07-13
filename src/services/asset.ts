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
          { jenisAset: { contains: search, mode: "insensitive" } },
          { merkType: { contains: search, mode: "insensitive" } },
          { distribution: { nama: { contains: search, mode: "insensitive" } } },
          { holder: { nama: { contains: search, mode: "insensitive" } } },
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
        distribution: true,
        holder: true,
        photos: true,
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
        distribution: true,
        holder: true,
        photos: true,
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
  nomorRegister: string;
  jenisAset: string;
  merkType: string;
  tahunPembelian: number;
  distributionId: string;
  holderId?: string | null;
  kondisi: Kondisi;
  catatan?: string | null;
  fotoUtama?: string | null;
  opdId: string;
  photos?: { url: string; caption?: string | null }[];
}

export async function createAsset(data: CreateAssetInput, userId: string) {
  try {
    const kodeLengkap = `${data.kode1}.${data.kode2}.${data.kode3}.${data.kode4}.${data.nomorRegister}`;

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
          nomorRegister: data.nomorRegister,
          kodeLengkap,
          jenisAset: data.jenisAset,
          merkType: data.merkType,
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

      // 2. Create Audit Log
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
  nomorRegister?: string;
  jenisAset?: string;
  merkType?: string;
  tahunPembelian?: number;
  distributionId?: string;
  holderId?: string | null;
  kondisi?: Kondisi;
  catatan?: string | null;
  fotoUtama?: string | null;
  photos?: { url: string; caption?: string | null }[];
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
    const reg = data.nomorRegister !== undefined ? data.nomorRegister : existingAsset.nomorRegister;
    const newKodeLengkap = `${k1}.${k2}.${k3}.${k4}.${reg}`;

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
          nomorRegister: data.nomorRegister,
          kodeLengkap,
          jenisAset: data.jenisAset,
          merkType: data.merkType,
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

      // 3. Create Audit Log
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

    // Breakdowns by condition
    const normal = await prisma.asset.count({ where: { opdId, kondisi: Kondisi.NORMAL } });
    const rusakRingan = await prisma.asset.count({ where: { opdId, kondisi: Kondisi.RUSAK_RINGAN } });
    const rusakBerat = await prisma.asset.count({ where: { opdId, kondisi: Kondisi.RUSAK_BERAT } });
    const hilang = await prisma.asset.count({ where: { opdId, kondisi: Kondisi.HILANG } });
    const perbaikan = await prisma.asset.count({ where: { opdId, kondisi: Kondisi.DALAM_PERBAIKAN } });
    const dipinjam = await prisma.asset.count({ where: { opdId, kondisi: Kondisi.DIPINJAM } });

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

    // Asset per jenisAset (Top 5 + Others)
    const assetsByJenis = await prisma.asset.groupBy({
      by: ["jenisAset"],
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

    const jenisChartData = assetsByJenis.map(item => ({
      name: item.jenisAset,
      total: item._count.id,
    }));

    // Latest assets
    const latestAssets = await prisma.asset.findMany({
      where: { opdId },
      include: { distribution: true, holder: true },
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
