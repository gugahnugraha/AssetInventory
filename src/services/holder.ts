import prisma from "./db";

export async function getAllHolders(opdId: string) {
  try {
    return await prisma.holder.findMany({
      where: {
        distribution: {
          opdId,
        },
      },
      include: {
        distribution: true,
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { nama: "asc" },
    });
  } catch (error) {
    console.error("Error in getAllHolders:", error);
    throw new Error("Gagal mengambil data pemegang barang");
  }
}

export async function getHolderById(id: string) {
  try {
    return await prisma.holder.findUnique({
      where: { id },
      include: {
        distribution: true,
        assets: true,
      },
    });
  } catch (error) {
    console.error("Error in getHolderById:", error);
    throw new Error("Gagal mengambil data pemegang barang berdasarkan ID");
  }
}

export interface CreateHolderInput {
  nama: string;
  nip?: string;
  jabatan: string;
  distributionId: string;
}

export async function createHolder(data: CreateHolderInput) {
  try {
    return await prisma.holder.create({
      data: {
        ...data,
        nip: data.nip ?? "",
      },
    });
  } catch (error) {
    console.error("Error in createHolder:", error);
    throw new Error("Gagal menambahkan pemegang barang baru");
  }
}

export async function updateHolder(id: string, data: Partial<CreateHolderInput>) {
  try {
    return await prisma.holder.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error in updateHolder:", error);
    throw new Error("Gagal memperbarui data pemegang barang");
  }
}

export async function deleteHolder(id: string) {
  try {
    return await prisma.holder.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error in deleteHolder:", error);
    throw new Error("Gagal menghapus pemegang barang. Pastikan tidak ada aset yang dipegang oleh orang ini.");
  }
}
