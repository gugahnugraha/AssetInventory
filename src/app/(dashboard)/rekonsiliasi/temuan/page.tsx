import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllFindings, getPeriodsByOpd } from "@/services/reconciliation";
import { TemuanClient } from "./TemuanClient";

export default async function TemuanPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const opdId = session.user.opdId;
  const periods = await getPeriodsByOpd(opdId);
  const findings = await getAllFindings(opdId);

  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === "object") return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    return obj;
  };

  return (
    <TemuanClient
      findings={serialize(findings)}
      periods={serialize(periods)}
      userRole={session.user.role}
    />
  );
}
