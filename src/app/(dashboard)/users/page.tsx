import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/services/user";
import { UserClient } from "./UserClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Kelola Pengguna - SIM Inventaris Aset OPD",
  description: "Daftar pegawai OPD yang memiliki kredensial akses SIM Inventaris.",
};

export default async function UsersPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Authorize: Only Administrator is allowed here
  if (session.user.role !== Role.ADMINISTRATOR) {
    redirect("/dashboard");
  }

  const opdId = session.user.opdId;
  const currentUserId = session.user.id;

  try {
    const users = await getAllUsers(opdId);

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedUsers = users.map((user) => ({
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    }));

    return (
      <UserClient
        initialUsers={serializedUsers}
        currentUserId={currentUserId}
      />
    );
  } catch (error) {
    console.error("Failed to load users page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil daftar pengguna. Silakan coba kembali.</p>
      </div>
    );
  }
}
