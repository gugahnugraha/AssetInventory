import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getRoomById } from "@/services/room";
import { RuanganDetailClient } from "./RuanganDetailClient";
import { Role } from "@prisma/client";
import { getPageTitle } from "@/lib/constants";

export const metadata = {
  title: getPageTitle("Detail Ruangan & KIR"),
  description: "Daftar inventaris aset dan cetak Kartu Inventaris Ruangan (KIR).",
};

interface RuanganDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RuanganDetailPage({ params }: RuanganDetailPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const { id } = await params;
  const userRole = session.user.role as Role;
  const opdName = session.user.opdName || "Dinas / Instansi";

  try {
    const room = await getRoomById(id);

    if (!room) {
      notFound();
    }

    const serializedRoom = {
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      distribution: {
        id: room.distribution.id,
        nama: room.distribution.nama,
        kode: room.distribution.kode,
        opd: {
          nama: room.distribution.opd?.nama || opdName,
        },
      },
      pjHolder: room.pjHolder
        ? {
            id: room.pjHolder.id,
            nama: room.pjHolder.nama,
            nip: room.pjHolder.nip,
            jabatan: room.pjHolder.jabatan,
          }
        : null,
      assets: room.assets.map((asset) => ({
        id: asset.id,
        kodeLengkap: asset.kodeLengkap,
        namaAset: asset.namaAset,
        merkType: asset.merkType,
        material: asset.material,
        tahunPembelian: asset.tahunPembelian,
        harga: asset.harga,
        kondisi: asset.kondisi,
        catatan: asset.catatan,
        category: {
          nama: asset.category.nama,
          kib: asset.category.kib ? { kode: asset.category.kib.kode, nama: asset.category.kib.nama } : null,
        },
        distribution: asset.distribution
          ? { id: asset.distribution.id, nama: asset.distribution.nama, kode: asset.distribution.kode }
          : null,
        holder: asset.holder ? { id: asset.holder.id, nama: asset.holder.nama } : null,
      })),
    };

    return (
      <RuanganDetailClient
        room={serializedRoom}
        userRole={userRole}
        opdName={opdName}
      />
    );
  } catch (error) {
    console.error("Failed to load room detail page:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil rincian ruangan. Silakan coba kembali.</p>
      </div>
    );
  }
}
