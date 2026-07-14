"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createAsset, updateAsset, deleteAsset, CreateAssetInput, UpdateAssetInput } from "@/services/asset";
import { DocumentService } from "@/services/document";
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
 * Server Action to upload a photo to R2 temporary directory
 */
export async function uploadAssetPhotoAction(formData: FormData) {
  try {
    await requireWriteAccess();
    
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "File foto tidak ditemukan." };
    }

    const info = await DocumentService.uploadTemporaryFile(file);
    const url = DocumentService.generateFileUrl(info.objectKey);
    return { success: true, ...info, url };
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

/**
 * Server Action to delete a temporary file if deleted from UI before form submit
 */
export async function deleteTemporaryPhotoAction(tempKey: string) {
  try {
    await requireWriteAccess();
    if (tempKey.startsWith("temporary/")) {
      await DocumentService.deleteFromR2(tempKey);
      return { success: true };
    }
    return { error: "Berkas bukan file sementara." };
  } catch (error: any) {
    console.error("Error in deleteTemporaryPhotoAction:", error);
    return { error: error.message || "Gagal menghapus file sementara." };
  }
}

/**
 * Server Action to set an existing detail photo as the primary photo
 */
export async function setPrimaryPhotoAction(assetId: string, photoId: string) {
  try {
    const session = await requireWriteAccess();

    await DocumentService.replacePrimaryPhoto(photoId, assetId, session.user.id);

    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in setPrimaryPhotoAction:", error);
    return { error: error.message || "Gagal mengatur foto utama baru." };
  }
}

/**
 * Server Action to delete (archive) a photo from asset gallery
 */
export async function deleteAssetPhotoAction(assetId: string, photoId: string) {
  try {
    const session = await requireWriteAccess();

    await DocumentService.deletePhoto(photoId, session.user.id);

    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/assets");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteAssetPhotoAction:", error);
    return { error: error.message || "Gagal menghapus foto." };
  }
}
