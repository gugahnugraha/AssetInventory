import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAssetReconciliation } from "@/services/reconciliation";
import { FormPemeriksaanClient } from "./FormPemeriksaanClient";

interface Props {
  params: Promise<{ reconId: string }>;
}

export default async function FormPemeriksaanPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { reconId } = await params;
  const recon = await getAssetReconciliation(reconId);
  if (!recon) notFound();

  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === "object") {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    }
    return obj;
  };

  return (
    <FormPemeriksaanClient
      recon={serialize(recon)}
      userRole={session.user.role}
      currentUserId={session.user.id}
    />
  );
}
