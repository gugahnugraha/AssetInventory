import { NextResponse } from "next/server";
import prisma from "@/services/db";
import { getDashboardStats, getAllAssets } from "@/services/asset";
import { getLaporanSummary } from "@/services/laporan";

export async function GET() {
  const log: string[] = ["Starting diagnostic..."];
  
  try {
    const firstOpd = await prisma.opd.findFirst();
    if (!firstOpd) {
      return new Response("No OPD found in database", { status: 200 });
    }
    const testOpdId = firstOpd.id;
    log.push(`Found test OPD: ${firstOpd.nama} (${testOpdId})`);

    // 1. Test getAllAssets
    log.push("Testing getAllAssets...");
    try {
      const assets = await getAllAssets(testOpdId);
      log.push(`getAllAssets success: found ${assets.length} assets`);
    } catch (e: any) {
      log.push(`getAllAssets FAILED: ${e.message}\nStack: ${e.stack}`);
    }

    // 2. Test getDashboardStats
    log.push("Testing getDashboardStats...");
    try {
      const stats = await getDashboardStats(testOpdId);
      log.push(`getDashboardStats success: total active=${stats.metrics.total}, total value=${stats.metrics.totalValue}`);
    } catch (e: any) {
      log.push(`getDashboardStats FAILED: ${e.message}\nStack: ${e.stack}`);
    }

    // 3. Test getLaporanSummary
    log.push("Testing getLaporanSummary...");
    try {
      const summary = await getLaporanSummary(testOpdId);
      log.push(`getLaporanSummary success: total assets=${summary.totalAssets}, total value=${summary.totalValue}`);
    } catch (e: any) {
      log.push(`getLaporanSummary FAILED: ${e.message}\nStack: ${e.stack}`);
    }

    return new Response(log.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    log.push(`Top-level FAILED: ${error.message}\nStack: ${error.stack}`);
    return new Response(log.join("\n"), {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
export const dynamic = "force-dynamic";
