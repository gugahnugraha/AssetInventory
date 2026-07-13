import prisma from "./db";

// CATEGORIES SERVICES

export async function getAllCategories() {
  try {
    return await prisma.category.findMany({
      include: {
        attributes: {
          orderBy: { displayOrder: "asc" }
        },
        _count: {
          select: { assets: true }
        }
      },
      orderBy: { nama: "asc" }
    });
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    throw new Error("Gagal mengambil data kategori");
  }
}

export async function getCategoryById(id: string) {
  try {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: { displayOrder: "asc" }
        }
      }
    });
  } catch (error) {
    console.error("Error in getCategoryById:", error);
    throw new Error("Gagal mengambil detail kategori");
  }
}

export async function createCategory(nama: string) {
  try {
    const cleanNama = nama.trim();
    if (!cleanNama) {
      throw new Error("Nama kategori tidak boleh kosong.");
    }
    
    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { nama: cleanNama }
    });
    if (existing) {
      throw new Error(`Kategori ${cleanNama} sudah terdaftar.`);
    }

    return await prisma.category.create({
      data: { nama: cleanNama }
    });
  } catch (error: any) {
    console.error("Error in createCategory:", error);
    throw new Error(error.message || "Gagal membuat kategori baru");
  }
}

export async function updateCategory(id: string, nama: string) {
  try {
    const cleanNama = nama.trim();
    if (!cleanNama) {
      throw new Error("Nama kategori tidak boleh kosong.");
    }

    // Check if name is taken by another category
    const existing = await prisma.category.findUnique({
      where: { nama: cleanNama }
    });
    if (existing && existing.id !== id) {
      throw new Error(`Kategori dengan nama ${cleanNama} sudah terdaftar.`);
    }

    return await prisma.category.update({
      where: { id },
      data: { nama: cleanNama }
    });
  } catch (error: any) {
    console.error("Error in updateCategory:", error);
    throw new Error(error.message || "Gagal memperbarui nama kategori");
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if category still has assets
    const count = await prisma.asset.count({
      where: { categoryId: id }
    });
    if (count > 0) {
      throw new Error("Kategori ini tidak dapat dihapus karena masih digunakan oleh beberapa aset.");
    }

    return await prisma.category.delete({
      where: { id }
    });
  } catch (error: any) {
    console.error("Error in deleteCategory:", error);
    throw new Error(error.message || "Gagal menghapus kategori");
  }
}


// CATEGORY ATTRIBUTES SERVICES

export async function createCategoryAttribute(data: {
  categoryId: string;
  nama: string;
  required?: boolean;
  fieldType?: string;
  displayOrder?: number;
}) {
  try {
    const cleanNama = data.nama.trim();
    if (!cleanNama) {
      throw new Error("Nama atribut tidak boleh kosong.");
    }

    // Check unique constraint
    const existing = await prisma.categoryAttribute.findUnique({
      where: {
        categoryId_nama: {
          categoryId: data.categoryId,
          nama: cleanNama
        }
      }
    });
    if (existing) {
      throw new Error(`Atribut dengan nama ${cleanNama} sudah ada pada kategori ini.`);
    }

    return await prisma.categoryAttribute.create({
      data: {
        categoryId: data.categoryId,
        nama: cleanNama,
        required: data.required || false,
        fieldType: data.fieldType || "TEXT",
        displayOrder: data.displayOrder || 0
      }
    });
  } catch (error: any) {
    console.error("Error in createCategoryAttribute:", error);
    throw new Error(error.message || "Gagal menambahkan atribut baru");
  }
}

export async function updateCategoryAttribute(
  id: string,
  data: {
    nama?: string;
    required?: boolean;
    fieldType?: string;
    displayOrder?: number;
  }
) {
  try {
    const updateData: any = {};
    if (data.nama !== undefined) {
      updateData.nama = data.nama.trim();
      if (!updateData.nama) {
        throw new Error("Nama atribut tidak boleh kosong.");
      }
    }
    if (data.required !== undefined) updateData.required = data.required;
    if (data.fieldType !== undefined) updateData.fieldType = data.fieldType;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

    return await prisma.categoryAttribute.update({
      where: { id },
      data: updateData
    });
  } catch (error: any) {
    console.error("Error in updateCategoryAttribute:", error);
    throw new Error(error.message || "Gagal memperbarui atribut");
  }
}

export async function deleteCategoryAttribute(id: string) {
  try {
    // Note: deleting category attribute will cascade delete all AssetAttribute values in the database
    return await prisma.categoryAttribute.delete({
      where: { id }
    });
  } catch (error: any) {
    console.error("Error in deleteCategoryAttribute:", error);
    throw new Error(error.message || "Gagal menghapus atribut kategori");
  }
}
