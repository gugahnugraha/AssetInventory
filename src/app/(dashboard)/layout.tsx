import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./DashboardLayoutClient";
import { Role } from "@prisma/client";
import prisma from "@/services/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch the active SKPD record directly from the database for dynamic updates
  const rawOpd = await prisma.opd.findUnique({
    where: { id: session.user.opdId },
  });

  const rawKode = rawOpd?.kode || session.user.opdKode || "DISKOMINFO";
  const opdShort = rawKode.charAt(0).toUpperCase() + rawKode.slice(1).toLowerCase();
  const opdNameFormatted = `${opdShort} Kab. Bandung`;

  const user = {
    nama: session.user.nama || session.user.name || "User",
    username: session.user.username || "",
    role: session.user.role as Role,
    opdName: opdNameFormatted,
    opdKode: rawKode,
  };

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}
