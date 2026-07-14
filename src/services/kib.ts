import prisma from "./db";

export async function getAllKibs() {
  try {
    return await prisma.kib.findMany({
      orderBy: { kode: "asc" },
      include: {
        _count: {
          select: { categories: true }
        }
      }
    });
  } catch (error) {
    console.error("Error in getAllKibs:", error);
    throw new Error("Gagal mengambil data master KIB");
  }
}

export async function getKibById(id: string) {
  try {
    return await prisma.kib.findUnique({
      where: { id },
      include: {
        categories: true
      }
    });
  } catch (error) {
    console.error("Error in getKibById:", error);
    throw new Error("Gagal mengambil detail KIB");
  }
}

export async function updateKib(
  id: string,
  data: {
    deskripsi?: string;
    isActive?: boolean;
  }
) {
  try {
    const existing = await prisma.kib.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("KIB tidak ditemukan.");
    }

    // Protection: Cannot deactivate or delete if it is not found (but status check is allowed)
    // Only update allowed fields
    const updateData: any = {};
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.kib.update({
      where: { id },
      data: updateData
    });
  } catch (error: any) {
    console.error("Error in updateKib:", error);
    throw new Error(error.message || "Gagal memperbarui data KIB");
  }
}
