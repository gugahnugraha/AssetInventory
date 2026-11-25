import prisma from "./db";
import { Kondisi } from "@prisma/client";

export interface CreateRoomInput {
  nama: string;
  kode: string;
  lantai?: string | null;
  distributionId: string;
  pjHolderId?: string | null;
}

export async function getAllRooms(opdId: string) {
  try {
    return await prisma.room.findMany({
      where: {
        distribution: {
          opdId,
        },
      },
      include: {
        distribution: true,
        pjHolder: true,
        _count: {
          select: { assets: true },
        },
      },
      orderBy: [
        { distribution: { kode: "asc" } },
        { kode: "asc" },
      ],
    });
  } catch (error) {
    console.error("Error in getAllRooms:", error);
    throw new Error("Gagal mengambil data ruangan");
  }
}

export async function getRoomsByDistribution(distributionId: string) {
  try {
    return await prisma.room.findMany({
      where: { distributionId },
      include: {
        pjHolder: true,
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { kode: "asc" },
    });
  } catch (error) {
    console.error("Error in getRoomsByDistribution:", error);
    throw new Error("Gagal mengambil data ruangan berdasarkan bidang");
  }
}

export async function getRoomById(id: string) {
  try {
    return await prisma.room.findUnique({
      where: { id },
      include: {
        distribution: {
          include: { opd: true },
        },
        pjHolder: true,
        assets: {
          where: { kondisi: { not: Kondisi.SUDAH_DIHAPUS } },
          include: {
            category: {
              include: { kib: true },
            },
            distribution: true,
            holder: true,
          },
          orderBy: { kodeLengkap: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Error in getRoomById:", error);
    throw new Error("Gagal mengambil detail ruangan");
  }
}

export async function createRoom(data: CreateRoomInput) {
  try {
    return await prisma.room.create({
      data: {
        nama: data.nama,
        kode: data.kode,
        lantai: data.lantai || null,
        distributionId: data.distributionId,
        pjHolderId: data.pjHolderId || null,
      },
      include: {
        distribution: true,
        pjHolder: true,
      },
    });
  } catch (error) {
    console.error("Error in createRoom:", error);
    throw new Error("Gagal menambahkan ruangan baru");
  }
}

export async function updateRoom(id: string, data: Partial<CreateRoomInput>) {
  try {
    return await prisma.room.update({
      where: { id },
      data: {
        ...(data.nama !== undefined && { nama: data.nama }),
        ...(data.kode !== undefined && { kode: data.kode }),
        ...(data.lantai !== undefined && { lantai: data.lantai || null }),
        ...(data.distributionId !== undefined && { distributionId: data.distributionId }),
        ...(data.pjHolderId !== undefined && { pjHolderId: data.pjHolderId || null }),
      },
      include: {
        distribution: true,
        pjHolder: true,
      },
    });
  } catch (error) {
    console.error("Error in updateRoom:", error);
    throw new Error("Gagal memperbarui data ruangan");
  }
}

export async function deleteRoom(id: string) {
  try {
    return await prisma.room.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error in deleteRoom:", error);
    throw new Error("Gagal menghapus ruangan. Pastikan tidak ada aset yang tertaut pada ruangan ini.");
  }
}
