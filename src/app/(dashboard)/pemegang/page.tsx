import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllHolders } from "@/services/holder";
import { getAllDistributions } from "@/services/distribution";
import { HolderClient } from "./HolderClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Pemegang Barang - SIM Inventaris Aset SKPD",
  description: "Kelola data aparatur penanggung jawab pemegang barang inventaris.",
};

export default async function PemegangPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;

  try {
    const holders = await getAllHolders(opdId);
    const distributions = await getAllDistributions(opdId);

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedHolders = holders.map((holder) => ({
      ...holder,
      createdAt: holder.createdAt.toISOString(),
      updatedAt: holder.updatedAt.toISOString(),
      distribution: {
        id: holder.distribution.id,
        nama: holder.distribution.nama,
      },
    }));

    const serializedDistributions = distributions.map((dist) => ({
      id: dist.id,
      nama: dist.nama,
    }));

    return (
      <HolderClient
        initialHolders={serializedHolders}
        distributions={serializedDistributions}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error("Failed to load pemegang page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil daftar pemegang barang. Silakan coba kembali.</p>
      </div>
    );
  }
}
