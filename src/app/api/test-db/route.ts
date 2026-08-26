import { NextResponse } from "next/server";

export async function GET() {
  const log: string[] = ["Starting dynamic import test..."];
  
  try {
    log.push("Attempting dynamic import of sharp...");
    try {
      const sharp = await import("sharp");
      log.push("sharp imported successfully! Type of sharp: " + typeof sharp);
    } catch (e: any) {
      log.push(`sharp import FAILED: ${e.message}\nStack: ${e.stack}`);
    }

    log.push("Attempting dynamic import of prisma adapter...");
    try {
      const db = await import("@/services/db");
      log.push("db imported successfully!");
      const userCount = await db.default.user.count();
      log.push(`user.count() succeeded: found ${userCount} users`);
    } catch (e: any) {
      log.push(`db import/query FAILED: ${e.message}\nStack: ${e.stack}`);
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
