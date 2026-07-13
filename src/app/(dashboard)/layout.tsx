import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./DashboardLayoutClient";
import { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const rawKode = session.user.opdKode || "DISKOMINFO";
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
