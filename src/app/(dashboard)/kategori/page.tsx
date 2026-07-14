import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getAllCategories } from "@/services/category";
import { getAllKibs } from "@/services/kib";
import { KategoriClient } from "./KategoriClient";

export const metadata = {
  title: "Master Kategori - SIM Inventaris Aset OPD",
  description: "Kelola master kategori aset dan definisi atribut dinamis.",
};

export default async function KategoriPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = session.user.role as Role;
  if (userRole !== Role.ADMINISTRATOR) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="mt-2 text-sm">Hanya Administrator yang memiliki akses untuk mengelola data master kategori aset.</p>
      </div>
    );
  }

  try {
    const [categories, kibs] = await Promise.all([
      getAllCategories(),
      getAllKibs()
    ]);

    // Filter active KIBs
    const activeKibs = kibs.filter(k => k.isActive).map(k => ({
      id: k.id,
      kode: k.kode,
      nama: k.nama
    }));

    // Serialize dates for Client Component safety
    const serializedCategories = categories.map((cat) => ({
      ...cat,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
      attributes: cat.attributes.map((attr) => ({
        ...attr,
        createdAt: attr.createdAt.toISOString(),
        updatedAt: attr.updatedAt.toISOString(),
      }))
    }));

    return (
      <KategoriClient
        initialCategories={serializedCategories}
        kibs={activeKibs}
      />
    );
  } catch (error) {
    console.error("Failed to load categories page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2 text-sm">Gagal mengambil daftar kategori. Silakan coba kembali.</p>
      </div>
    );
  }
}
