import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllRooms } from "@/services/room";
import { getAllDistributions } from "@/services/distribution";
import { getAllHolders } from "@/services/holder";
import { RuanganClient } from "./RuanganClient";
import { Role } from "@prisma/client";
import { getPageTitle } from "@/lib/constants";

export const metadata = {
  title: getPageTitle("Manajemen Ruangan (KIR)"),
  description: "Manajemen ruangan per bidang kerja dan Kartu Inventaris Ruangan (KIR).",
};

export default async function RuanganPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;
  const opdName = session.user.opdName || "Dinas / Instansi";

  try {
    const [rooms, distributions, holders] = await Promise.all([
      getAllRooms(opdId),
      getAllDistributions(opdId),
      getAllHolders(opdId),
    ]);

    const serializedRooms = rooms.map((room) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      distribution: {
        id: room.distribution.id,
        nama: room.distribution.nama,
        kode: room.distribution.kode,
      },
      pjHolder: room.pjHolder
        ? {
            id: room.pjHolder.id,
            nama: room.pjHolder.nama,
            nip: room.pjHolder.nip,
            jabatan: room.pjHolder.jabatan,
          }
        : null,
      assetCount: room._count.assets,
    }));

    const serializedDistributions = distributions.map((d) => ({
      id: d.id,
      nama: d.nama,
      kode: d.kode,
    }));

    const serializedHolders = holders.map((h) => ({
      id: h.id,
      nama: h.nama,
      nip: h.nip,
      jabatan: h.jabatan,
      distributionId: h.distributionId,
    }));

    return (
      <RuanganClient
        initialRooms={serializedRooms}
        distributions={serializedDistributions}
        holders={serializedHolders}
        userRole={userRole}
        opdName={opdName}
      />
    );
  } catch (error) {
    console.error("Failed to load ruangan page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil daftar ruangan. Silakan coba kembali.</p>
      </div>
    );
  }
}
