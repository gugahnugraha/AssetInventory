import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPeriodsByOpd, generateReportData } from "@/services/reconciliation";
import { LaporanClient } from "./LaporanClient";

export default async function LaporanPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const opdId = session.user.opdId;
  const periods = await getPeriodsByOpd(opdId);

  // Default to latest period
  const latestPeriod = periods[0] || null;

  let reportData: any = null;
  if (latestPeriod) {
    reportData = await generateReportData(latestPeriod.id, opdId);
  }

  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === "object") return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    return obj;
  };

  return (
    <LaporanClient
      periods={serialize(periods)}
      initialReportData={serialize(reportData)}
      userRole={session.user.role}
      opdId={opdId}
    />
  );
}
