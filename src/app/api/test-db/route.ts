import { NextResponse } from "next/server";
import prisma from "@/services/db";
import { getDashboardStats, getAllAssets } from "@/services/asset";
import { getLaporanSummary } from "@/services/laporan";
import { getRecentAuditLogs } from "@/services/auditLog";
import { getRecentHistories } from "@/services/history";

export async function GET() {
  const opdId = "0f2495ea-6a3c-4235-9f5b-1c5fae46ea20"; // Any valid opdId from seed or database
  
  try {
    // 1. Get first OPD ID dynamically from database to make sure it's valid
    const firstOpd = await prisma.opd.findFirst();
    const testOpdId = firstOpd ? firstOpd.id : opdId;

    const results: any = {
      testOpdId,
    };

    // Test getDashboardStats
    try {
      results.dashboardStats = await getDashboardStats(testOpdId);
      results.dashboardStats_status = "success";
    } catch (e: any) {
      results.dashboardStats_error = {
        message: e.message || String(e),
        stack: e.stack,
      };
    }

    // Test getAllAssets
    try {
      const assets = await getAllAssets(testOpdId);
      results.assetsCount = assets.length;
      results.getAllAssets_status = "success";
    } catch (e: any) {
      results.getAllAssets_error = {
        message: e.message || String(e),
        stack: e.stack,
      };
    }

    // Test getLaporanSummary
    try {
      results.laporanSummary = await getLaporanSummary(testOpdId);
      results.laporanSummary_status = "success";
    } catch (e: any) {
      results.laporanSummary_error = {
        message: e.message || String(e),
        stack: e.stack,
      };
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack,
    }, { status: 500 });
  }
}
