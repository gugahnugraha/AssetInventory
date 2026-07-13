"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createCategoryAttribute,
  updateCategoryAttribute,
  deleteCategoryAttribute
} from "@/services/category";

// Guard to check if current user is an Administrator
async function requireAdminAccess() {
  const session = await auth();
  if (!session) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }
  if (session.user.role !== Role.ADMINISTRATOR) {
    throw new Error("Akses ditolak. Hanya Administrator yang dapat mengelola data master kategori.");
  }
  return session;
}

// CATEGORY ACTIONS

export async function createCategoryAction(nama: string) {
  try {
    await requireAdminAccess();
    const newCat = await createCategory(nama);
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true, category: newCat };
  } catch (error: any) {
    console.error("Error in createCategoryAction:", error);
    return { error: error.message || "Gagal membuat kategori baru." };
  }
}

export async function updateCategoryAction(id: string, nama: string) {
  try {
    await requireAdminAccess();
    const updated = await updateCategory(id, nama);
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true, category: updated };
  } catch (error: any) {
    console.error("Error in updateCategoryAction:", error);
    return { error: error.message || "Gagal memperbarui nama kategori." };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await requireAdminAccess();
    await deleteCategory(id);
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteCategoryAction:", error);
    return { error: error.message || "Gagal menghapus kategori." };
  }
}

// CATEGORY ATTRIBUTE ACTIONS

export async function createCategoryAttributeAction(data: {
  categoryId: string;
  nama: string;
  required?: boolean;
  fieldType?: string;
  displayOrder?: number;
}) {
  try {
    await requireAdminAccess();
    const newAttr = await createCategoryAttribute(data);
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true, attribute: newAttr };
  } catch (error: any) {
    console.error("Error in createCategoryAttributeAction:", error);
    return { error: error.message || "Gagal menambahkan atribut baru." };
  }
}

export async function updateCategoryAttributeAction(
  id: string,
  data: {
    nama?: string;
    required?: boolean;
    fieldType?: string;
    displayOrder?: number;
  }
) {
  try {
    await requireAdminAccess();
    const updated = await updateCategoryAttribute(id, data);
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true, attribute: updated };
  } catch (error: any) {
    console.error("Error in updateCategoryAttributeAction:", error);
    return { error: error.message || "Gagal memperbarui atribut." };
  }
}

export async function deleteCategoryAttributeAction(id: string) {
  try {
    await requireAdminAccess();
    await deleteCategoryAttribute(id);
    revalidatePath("/kategori");
    revalidatePath("/assets");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteCategoryAttributeAction:", error);
    return { error: error.message || "Gagal menghapus atribut kategori." };
  }
}
