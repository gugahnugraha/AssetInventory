import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getAllKibs } from "@/services/kib";
import { KibClient } from "./KibClient";

export const metadata = {
  title: "Master KIB - SIM Inventaris Aset SKPD",
  description: "Kelola klasifikasi Kartu Inventaris Barang (KIB) A-F.",
};

export default async function KibPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = session.user.role as Role;
  if (userRole !== Role.ADMINISTRATOR && userRole !== Role.OPERATOR && userRole !== Role.DEMO) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="mt-2 text-sm">Hanya Administrator yang memiliki akses untuk mengelola data master KIB.</p>
      </div>
    );
  }

  try {
    const kibs = await getAllKibs();

    // Serialize dates for Client Component safety
    const serializedKibs = kibs.map((k) => ({
      ...k,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
    }));

    return <KibClient initialKibs={serializedKibs} userRole={userRole} />;
  } catch (error) {
    console.error("Failed to load KIB page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2 text-sm">Gagal mengambil daftar KIB. Silakan coba kembali.</p>
      </div>
    );
  }
}
