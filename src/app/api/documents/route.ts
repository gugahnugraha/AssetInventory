import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "@/services/document";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user to ensure they are logged in
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Get key parameter
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return new NextResponse("Missing key parameter", { status: 400 });
    }

    // 3. Get the file from R2
    const { buffer, contentType } = await DocumentService.getFileFromR2(key);

    // 4. Return as Response with appropriate headers
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving document:", error);
    return new NextResponse("File not found or access denied", { status: 404 });
  }
}
