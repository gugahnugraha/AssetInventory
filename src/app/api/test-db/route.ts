import { NextResponse } from "next/server";
import prisma from "@/services/db";

export async function GET() {
  try {
    // 1. Check if database connection works
    const userCount = await prisma.user.count();
    
    // 2. Check if querying Asset works
    let assetError = null;
    let assetCount = null;
    try {
      assetCount = await prisma.asset.count();
    } catch (e: any) {
      assetError = {
        message: e.message || String(e),
        stack: e.stack,
        code: e.code,
        meta: e.meta,
      };
    }

    // 3. Check environment variables (masked)
    const envs = {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_PRE: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "not set",
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      database: "connected",
      userCount,
      assetCount,
      assetError,
      envs,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack,
    }, { status: 500 });
  }
}
