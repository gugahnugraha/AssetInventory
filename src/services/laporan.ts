import prisma from "./db";
import { Kondisi } from "@prisma/client";

// =============================================
// LAPORAN — DATA AGGREGATION SERVICE
// =============================================

/**
 * Get summary statistics for the laporan dashboard tab.
 * Returns: total assets, total value, breakdown by kondisi, breakdown by KIB.
 */
export async function getLaporanSummary(opdId: string) {
  const [assets, kibList] = await Promise.all([
    prisma.asset.findMany({
      where: {
        opdId,
        kondisi: { not: Kondisi.SUDAH_DIHAPUS }
      },
      select: {
        kondisi: true,
        harga: true,
        category: {
          select: {
            kib: {
              select: { id: true, kode: true, nama: true },
            },
          },
        },
      },
    }),
    prisma.kib.findMany({
      where: { isActive: true },
      orderBy: { kode: "asc" },
    }),
  ]);

  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, a) => sum + (a.harga || 0), 0);

  // Breakdown by kondisi
  const kondisiOrder: Kondisi[] = [
    "NORMAL",
    "RUSAK_RINGAN",
    "RUSAK_BERAT",
    "DALAM_PERBAIKAN",
    "DIPINJAM",
    "HILANG",
  ];
  const byKondisi: Record<string, { count: number; value: number }> = {};
  for (const k of kondisiOrder) {
    byKondisi[k] = { count: 0, value: 0 };
  }
  for (const a of assets) {
    if (byKondisi[a.kondisi]) {
      byKondisi[a.kondisi].count++;
      byKondisi[a.kondisi].value += a.harga || 0;
    }
  }

  // Breakdown by KIB
  const byKib: Record<string, { kode: string; nama: string; count: number; value: number }> = {};
  for (const kib of kibList) {
    byKib[kib.id] = { kode: kib.kode, nama: kib.nama, count: 0, value: 0 };
  }
  for (const a of assets) {
    const kibId = a.category?.kib?.id;
    if (kibId && byKib[kibId]) {
      byKib[kibId].count++;
      byKib[kibId].value += a.harga || 0;
    }
  }

  return {
    totalAssets,
    totalValue,
    byKondisi,
    byKib: Object.values(byKib).sort((a, b) => a.kode.localeCompare(b.kode)),
  };
}

/**
 * Get all active assets for the Daftar Aset report, with full relations.
 */
export async function getLaporanAssets(opdId: string) {
  return prisma.asset.findMany({
    where: {
      opdId,
      kondisi: { not: Kondisi.SUDAH_DIHAPUS }
    },
    select: {
      id: true,
      kodeLengkap: true,
      namaAset: true,
      merkType: true,
      harga: true,
      tahunPembelian: true,
      kondisi: true,
      catatan: true,
      spesifikasi: true,
      caraPerolehan: true,
      createdAt: true,
      category: {
        select: {
          nama: true,
          kib: { select: { kode: true, nama: true } },
        },
      },
      distribution: { select: { nama: true } },
      holder: { select: { nama: true, jabatan: true, nip: true } },
    },
    orderBy: [{ category: { kibId: "asc" } }, { namaAset: "asc" }],
  });
}

/**
 * Get active asset value breakdown per KIB and per Distribution.
 */
export async function getLaporanNilaiAset(opdId: string) {
  const assets = await prisma.asset.findMany({
    where: {
      opdId,
      kondisi: { not: Kondisi.SUDAH_DIHAPUS }
    },
    select: {
      harga: true,
      tahunPembelian: true,
      category: {
        select: {
          kib: { select: { id: true, kode: true, nama: true } },
        },
      },
      distribution: { select: { id: true, nama: true } },
    },
  });

  // Per KIB
  const perKib: Record<string, { kode: string; nama: string; count: number; value: number }> = {};
  // Per Distribution
  const perDistribusi: Record<string, { nama: string; count: number; value: number }> = {};
  // Per Year
  const perTahun: Record<number, { count: number; value: number }> = {};

  for (const a of assets) {
    const kib = a.category?.kib;
    const dist = a.distribution;
    const harga = a.harga || 0;

    if (kib) {
      if (!perKib[kib.id]) {
        perKib[kib.id] = { kode: kib.kode, nama: kib.nama, count: 0, value: 0 };
      }
      perKib[kib.id].count++;
      perKib[kib.id].value += harga;
    }

    if (dist) {
      if (!perDistribusi[dist.id]) {
        perDistribusi[dist.id] = { nama: dist.nama, count: 0, value: 0 };
      }
      perDistribusi[dist.id].count++;
      perDistribusi[dist.id].value += harga;
    }

    const tahun = a.tahunPembelian;
    if (tahun) {
      if (!perTahun[tahun]) perTahun[tahun] = { count: 0, value: 0 };
      perTahun[tahun].count++;
      perTahun[tahun].value += harga;
    }
  }

  return {
    perKib: Object.values(perKib).sort((a, b) => a.kode.localeCompare(b.kode)),
    perDistribusi: Object.values(perDistribusi).sort((a, b) => b.value - a.value),
    perTahun: Object.entries(perTahun)
      .map(([tahun, v]) => ({ tahun: Number(tahun), ...v }))
      .sort((a, b) => a.tahun - b.tahun),
    totalValue: assets.reduce((s, a) => s + (a.harga || 0), 0),
    totalCount: assets.length,
  };
}

/**
 * Get audit log for a specific OPD, with user and asset relations.
 */
export async function getLaporanAuditLog(opdId: string, limit = 200) {
  // Audit logs are either linked to an asset (asset-level ops) or system ops (no asset)
  // We fetch logs where the asset belongs to this OPD, plus system ops by users of this OPD
  return prisma.auditLog.findMany({
    where: {
      OR: [
        { asset: { opdId } },
        { assetId: null, user: { opdId } },
      ],
    },
    include: {
      user: {
        select: { nama: true, username: true, role: true },
      },
      asset: {
        select: { kodeLengkap: true, namaAset: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get active assets that do not have a primary photo document.
 */
export async function getAssetsWithoutPhoto(opdId: string) {
  const allAssets = await prisma.asset.findMany({
    where: {
      opdId,
      fotoUtama: null,
      kondisi: { not: Kondisi.SUDAH_DIHAPUS }
    },
    select: {
      id: true,
      kodeLengkap: true,
      namaAset: true,
      kondisi: true,
      category: { select: { nama: true, kib: { select: { kode: true } } } },
      distribution: { select: { nama: true } },
    },
    orderBy: { namaAset: "asc" },
  });
  return allAssets;
}
