"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Role, Kondisi } from "@prisma/client";
import { uploadFile } from "@/lib/r2";
import { createAssetHistory } from "@/services/history";

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
 * Server Action to perform an asset mutation with optional Berita Acara upload
 */
export async function createAssetMutationAction(formData: FormData) {
  try {
    const session = await requireWriteAccess();

    const assetId = formData.get("assetId") as string;
    const toDistributionId = formData.get("toDistributionId") as string || null;
    const toHolderId = formData.get("toHolderId") as string || null;
    const toCondition = formData.get("toCondition") as Kondisi || null;
    const beritaAcaraNumber = formData.get("beritaAcaraNumber") as string;
    const beritaAcaraDateStr = formData.get("beritaAcaraDate") as string;
    const description = formData.get("description") as string || null;
    const file = formData.get("file") as File | null;

    if (!assetId) {
      return { error: "Aset wajib dipilih." };
    }
    if (!beritaAcaraNumber) {
      return { error: "Nomor Berita Acara wajib diisi." };
    }
    if (!beritaAcaraDateStr) {
      return { error: "Tanggal Berita Acara wajib diisi." };
    }

    let document = null;
    // Check if a file was actually uploaded
    if (file && file.size > 0 && file.name !== "undefined") {
      try {
        const fileUrl = await uploadFile(file);
        document = {
          fileName: file.name,
          fileUrl,
        };
      } catch (uploadError: any) {
        return { error: uploadError.message || "Gagal mengunggah dokumen Berita Acara." };
      }
    }

    await createAssetHistory({
      assetId,
      toDistributionId,
      toHolderId,
      toCondition,
      beritaAcaraNumber,
      beritaAcaraDate: new Date(beritaAcaraDateStr),
      description,
      createdBy: session.user.id,
      document,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/mutasi");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error in createAssetMutationAction Server Action:", error);
    return { error: error.message || "Gagal memproses mutasi aset." };
  }
}
