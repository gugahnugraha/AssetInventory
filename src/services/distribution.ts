import prisma from "./db";

export async function getAllDistributions(opdId: string) {
  try {
    return await prisma.distribution.findMany({
      where: { opdId },
      include: {
        _count: {
          select: { assets: true, holders: true },
        },
      },
      orderBy: { kode: "asc" },
    });
  } catch (error) {
    console.error("Error in getAllDistributions:", error);
    throw new Error("Gagal mengambil data bidang distribusi");
  }
}

export async function getDistributionById(id: string) {
  try {
    return await prisma.distribution.findUnique({
      where: { id },
      include: {
        holders: true,
        assets: true,
      },
    });
  } catch (error) {
    console.error("Error in getDistributionById:", error);
    throw new Error("Gagal mengambil bidang distribusi berdasarkan ID");
  }
}

export async function createDistribution(nama: string, kode: number, opdId: string) {
  try {
    return await prisma.distribution.create({
      data: {
        nama,
        kode,
        opdId,
      },
    });
  } catch (error) {
    console.error("Error in createDistribution:", error);
    throw new Error("Gagal membuat bidang distribusi baru");
  }
}

export async function updateDistribution(id: string, nama: string, kode: number) {
  try {
    return await prisma.distribution.update({
      where: { id },
      data: { nama, kode },
    });
  } catch (error) {
    console.error("Error in updateDistribution:", error);
    throw new Error("Gagal memperbarui bidang distribusi");
  }
}

export async function deleteDistribution(id: string) {
  try {
    return await prisma.distribution.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error in deleteDistribution:", error);
    throw new Error("Gagal menghapus bidang distribusi. Pastikan tidak ada pemegang barang atau aset yang terkait.");
  }
}
