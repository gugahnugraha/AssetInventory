import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getLaporanSummary,
  getLaporanAssets,
  getLaporanNilaiAset,
  getLaporanAuditLog,
  getAssetsWithoutPhoto,
} from "@/services/laporan";
import { getAllHistories } from "@/services/history";
import { getPeriodsByOpd, generateReportData } from "@/services/reconciliation";
import { LaporanPageClient } from "./LaporanPageClient";

// Deep-serialize: convert Date objects to ISO strings so they can be passed as props
function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serialize) as unknown as T;
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serialize(v)])
    ) as unknown as T;
  }
  return obj;
}

export const metadata = {
  title: "Laporan Aset",
  description: "Halaman laporan inventaris aset daerah",
};

export default async function LaporanPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const opdId = session.user.opdId;

  // Fetch all data server-side in parallel
  const [summary, assets, nilaiAset, mutasiHistories, auditLogs, assetsWithoutPhoto, reconPeriods] =
    await Promise.all([
      getLaporanSummary(opdId),
      getLaporanAssets(opdId),
      getLaporanNilaiAset(opdId),
      getAllHistories(opdId),
      getLaporanAuditLog(opdId, 300),
      getAssetsWithoutPhoto(opdId),
      getPeriodsByOpd(opdId),
    ]);

  // Fetch latest reconciliation report data (if a period exists)
  const latestPeriod = reconPeriods[0] || null;
  const reconReportData = latestPeriod
    ? await generateReportData(latestPeriod.id, opdId)
    : null;

  return (
    <LaporanPageClient
      summary={serialize(summary)}
      assets={serialize(assets)}
      nilaiAset={serialize(nilaiAset)}
      mutasiHistories={serialize(mutasiHistories)}
      auditLogs={serialize(auditLogs)}
      assetsWithoutPhoto={serialize(assetsWithoutPhoto)}
      reconPeriods={serialize(reconPeriods)}
      reconReportData={serialize(reconReportData)}
      userRole={session.user.role}
      opdName={session.user.opdName ?? ""}
    />
  );
}
