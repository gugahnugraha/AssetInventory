import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/services/db";
import { ProfileClient } from "./ProfileClient";
import { Role } from "@prisma/client";
import { getPageTitle } from "@/lib/constants";

export const metadata = {
  title: getPageTitle("Profil Saya"),
  description: "Pengaturan akun dan profil pengguna.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  try {
    // Fetch user and SKPD details
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { opd: true },
    });

    if (!userData) {
      redirect("/login");
    }

    const user = {
      id: userData.id,
      nama: userData.nama,
      username: userData.username,
      role: userData.role as Role,
      opdName: userData.opd.nama,
      opdKode: userData.opd.kode,
    };

    return <ProfileClient user={user} />;
  } catch (error) {
    console.error("Failed to load profile page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil data profil Anda. Silakan coba kembali.</p>
      </div>
    );
  }
}
