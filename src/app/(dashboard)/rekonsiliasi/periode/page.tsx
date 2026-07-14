import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPeriodsByOpd } from "@/services/reconciliation";
import { PeriodeClient } from "./PeriodeClient";

export default async function PeriodePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const periods = await getPeriodsByOpd(session.user.opdId);

  const serialized = periods.map((p) => ({
    ...p,
    tanggalMulai: p.tanggalMulai.toISOString(),
    tanggalSelesai: p.tanggalSelesai.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <PeriodeClient periods={serialized} userRole={session.user.role} />;
}
