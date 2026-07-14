"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createUser, updateUser, deleteUser, CreateUserInput } from "@/services/user";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// Guard to check if current user is Administrator
async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMINISTRATOR) {
    throw new Error("Akses ditolak. Anda harus menjadi Administrator.");
  }
  return session;
}

export async function createUserAction(data: {
  nama: string;
  username: string;
  passwordHash: string; // Plain password passed from client, we will hash it
  role: Role;
  isActive?: boolean;
}) {
  try {
    const session = await requireAdmin();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    const newUser = await createUser({
      nama: data.nama,
      username: data.username.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      opdId: session.user.opdId,
      isActive: data.isActive,
    });

    revalidatePath("/users");
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("Error in createUserAction:", error);
    return { error: error.message || "Gagal membuat user baru" };
  }
}

export async function updateUserAction(
  id: string,
  data: {
    nama?: string;
    username?: string;
    password?: string; // Plain password if changing
    role?: Role;
    isActive?: boolean;
  }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("Akses ditolak. Silakan login terlebih dahulu.");
    }

    const isSelfUpdate = session.user.id === id;
    const isAdmin = session.user.role === Role.ADMINISTRATOR;

    // Guard: Can only edit if it's self-update OR is administrator
    if (!isSelfUpdate && !isAdmin) {
      throw new Error("Akses ditolak. Anda tidak memiliki wewenang untuk memperbarui pengguna ini.");
    }

    const updateData: any = {};
    if (data.nama !== undefined) updateData.nama = data.nama;

    // Only administrator can update username, role, and active status
    if (isAdmin) {
      if (data.username !== undefined) updateData.username = data.username.toLowerCase().trim();
      if (data.role !== undefined) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
    }

    if (data.password && data.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    const updatedUser = await updateUser(id, updateData);
    
    revalidatePath("/users");
    revalidatePath("/profile");
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error("Error in updateUserAction:", error);
    return { error: error.message || "Gagal memperbarui data user" };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const session = await requireAdmin();

    if (id === session.user.id) {
      return { error: "Anda tidak dapat menghapus akun Anda sendiri." };
    }

    await deleteUser(id);
    
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteUserAction:", error);
    return { error: error.message || "Gagal menghapus user" };
  }
}
