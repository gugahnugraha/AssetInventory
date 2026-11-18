"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomsByDistribution,
  CreateRoomInput,
} from "@/services/room";
import { Role } from "@prisma/client";

async function requireWriteAccess() {
  const session = await auth();
  if (!session) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }
  if (session.user.role === Role.DEMO) {
    throw new Error("Demo Only: Anda tidak diizinkan melakukan perubahan.");
  }
  if (session.user.role === Role.MANAGER) {
    throw new Error("Akses ditolak. Pengguna dengan hak akses Manager hanya dapat membaca data.");
  }
  return session;
}

export async function createRoomAction(data: CreateRoomInput) {
  try {
    await requireWriteAccess();

    if (!data.nama.trim() || !data.kode.trim() || !data.distributionId) {
      return { error: "Nama ruangan, kode ruangan, dan bidang wajib diisi." };
    }

    const newRoom = await createRoom({
      nama: data.nama.trim(),
      kode: data.kode.trim(),
      lantai: data.lantai?.trim() || null,
      distributionId: data.distributionId,
      pjHolderId: data.pjHolderId || null,
    });

    revalidatePath("/ruangan");
    revalidatePath("/distribusi");
    return { success: true, room: newRoom };
  } catch (error: any) {
    console.error("Error in createRoomAction:", error);
    return { error: error.message || "Gagal membuat ruangan baru" };
  }
}

export async function updateRoomAction(id: string, data: Partial<CreateRoomInput>) {
  try {
    await requireWriteAccess();

    const cleanData: Partial<CreateRoomInput> = {};
    if (data.nama !== undefined) cleanData.nama = data.nama.trim();
    if (data.kode !== undefined) cleanData.kode = data.kode.trim();
    if (data.lantai !== undefined) cleanData.lantai = data.lantai?.trim() || null;
    if (data.distributionId !== undefined) cleanData.distributionId = data.distributionId;
    if (data.pjHolderId !== undefined) cleanData.pjHolderId = data.pjHolderId || null;

    const updatedRoom = await updateRoom(id, cleanData);

    revalidatePath("/ruangan");
    revalidatePath("/distribusi");
    return { success: true, room: updatedRoom };
  } catch (error: any) {
    console.error("Error in updateRoomAction:", error);
    return { error: error.message || "Gagal memperbarui data ruangan" };
  }
}

export async function deleteRoomAction(id: string) {
  try {
    await requireWriteAccess();
    await deleteRoom(id);

    revalidatePath("/ruangan");
    revalidatePath("/distribusi");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteRoomAction:", error);
    return { error: error.message || "Gagal menghapus ruangan" };
  }
}

export async function fetchRoomsByDistributionAction(distributionId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { error: "Tidak diautentikasi" };
    }
    const rooms = await getRoomsByDistribution(distributionId);
    return { success: true, rooms };
  } catch (error: any) {
    console.error("Error in fetchRoomsByDistributionAction:", error);
    return { error: error.message || "Gagal mengambil data ruangan bidang" };
  }
}
