"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createAsset, updateAsset, deleteAsset, CreateAssetInput, UpdateAssetInput } from "@/services/asset";
import { uploadFile } from "@/lib/r2";
import { Role, Kondisi } from "@prisma/client";

// Guard to check if current user has write access (Admin or Operator)
async function requireWriteAccess() {
  const session = await auth();
  if (!session) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }
  if (session.user.role === Role.MANAGER) {
    throw new Error("Akses ditolak. Pengguna dengan hak akses Manager hanya dapat membaca data.");
  }
  return session;
}

/**
 * Server Action to upload a photo to R2
 */
export async function uploadAssetPhotoAction(formData: FormData) {
  try {
    await requireWriteAccess();
    
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "File foto tidak ditemukan." };
    }

    const url = await uploadFile(file);
    return { success: true, url };
  } catch (error: any) {
    console.error("Error in uploadAssetPhotoAction:", error);
    return { error: error.message || "Gagal mengupload foto." };
  }
}

/**
 * Server Action to create a new asset
 */
export async function createAssetAction(data: Omit<CreateAssetInput, "opdId">) {
  try {
    const session = await requireWriteAccess();

    const asset = await createAsset(
      {
        ...data,
        opdId: session.user.opdId,
      },
      session.user.id
    );

    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true, asset };
  } catch (error: any) {
    console.error("Error in createAssetAction:", error);
    return { error: error.message || "Gagal menambahkan aset baru." };
  }
}

/**
 * Server Action to update an existing asset
 */
export async function updateAssetAction(id: string, data: UpdateAssetInput) {
  try {
    const session = await requireWriteAccess();

    const asset = await updateAsset(id, data, session.user.id);

    revalidatePath("/assets");
    revalidatePath(`/assets/${id}`);
    revalidatePath("/dashboard");
    return { success: true, asset };
  } catch (error: any) {
    console.error("Error in updateAssetAction:", error);
    return { error: error.message || "Gagal memperbarui data aset." };
  }
}

/**
 * Server Action to delete an asset
 */
export async function deleteAssetAction(id: string) {
  try {
    const session = await requireWriteAccess();

    await deleteAsset(id, session.user.id);

    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteAssetAction:", error);
    return { error: error.message || "Gagal menghapus aset." };
  }
}
