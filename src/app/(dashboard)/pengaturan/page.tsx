import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/services/db";
import { SettingsClient } from "./SettingsClient";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Pengaturan Sistem - SIM Inventaris Aset SKPD",
  description: "Diagnostik server, status runtime instansi, dan konfigurasi database.",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const opdId = session.user.opdId;
  const userRole = session.user.role as Role;

  try {
    const opd = await prisma.opd.findUnique({
      where: { id: opdId },
    });

    if (!opd) {
      redirect("/login");
    }

    const isR2Configured = !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
    );

    return (
      <SettingsClient
        opd={{
          id: opd.id,
          nama: opd.nama,
          kode: opd.kode,
          kodeNumeric: opd.kodeNumeric || "",
        }}
        isR2Configured={isR2Configured}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error("Failed to load settings page data:", error);
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2">Gagal mengambil pengaturan instansi. Silakan coba kembali.</p>
      </div>
    );
  }
}
