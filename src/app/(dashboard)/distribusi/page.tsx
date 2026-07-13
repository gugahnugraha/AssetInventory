import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllDistributions } from "@/services/distribution";
import { DistribusiClient } from "./DistribusiClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Bidang Distribusi - SIM Inventaris Aset OPD",
  description: "Kelola data bidang dan unit penempatan barang milik daerah.",
};

export default async function DistribusiPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;

  try {
    const distributions = await getAllDistributions(opdId);

    // Serialize database models (convert Date objects to JSON-friendly string ISO dates)
    const serializedDistributions = distributions.map((dist) => ({
      ...dist,
      createdAt: dist.createdAt.toISOString(),
      updatedAt: dist.updatedAt.toISOString(),
    }));

    return (
      <DistribusiClient
        initialDistributions={serializedDistributions}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error("Failed to load distribution page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil daftar bidang distribusi. Silakan coba kembali.</p>
      </div>
    );
  }
}
