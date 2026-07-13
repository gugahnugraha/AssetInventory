import prisma from "./db";
import { Role } from "@prisma/client";

export async function getUserByUsername(username: string) {
  try {
    return await prisma.user.findUnique({
      where: { username },
      include: { opd: true },
    });
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    throw new Error("Gagal mengambil data user berdasarkan username");
  }
}

export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: { opd: true },
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw new Error("Gagal mengambil data user berdasarkan ID");
  }
}

export async function getAllUsers(opdId: string) {
  try {
    return await prisma.user.findMany({
      where: { opdId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw new Error("Gagal mengambil daftar user");
  }
}

export interface CreateUserInput {
  nama: string;
  username: string;
  passwordHash: string;
  role: Role;
  opdId: string;
  isActive?: boolean;
}

export async function createUser(data: CreateUserInput) {
  try {
    return await prisma.user.create({
      data: {
        nama: data.nama,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role,
        opdId: data.opdId,
        isActive: data.isActive ?? true,
      },
    });
  } catch (error) {
    console.error("Error in createUser:", error);
    throw new Error("Gagal membuat user baru");
  }
}

export async function updateUser(
  id: string,
  data: Partial<Omit<CreateUserInput, "opdId">> & { lastLogin?: Date | null }
) {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw new Error("Gagal memperbarui data user");
  }
}

export async function deleteUser(id: string) {
  try {
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw new Error("Gagal menghapus user");
  }
}
