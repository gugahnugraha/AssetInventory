import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

// Verify environment variables for R2
const isR2Configured =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME &&
  process.env.R2_PUBLIC_URL;

// Instantiate the S3 Client if configured
const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    })
  : null;

/**
 * Uploads a file either to Cloudflare R2 (production) or locally to public/uploads/ (local fallback)
 * @param file File object from FormData
 * @returns Uploaded file URL
 */
export async function uploadFile(file: File): Promise<string> {
  // Validate File size (Max 5MB)
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    throw new Error("Ukuran file maksimal adalah 5 MB.");
  }

  // Validate File type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.");
  }

  const fileExtension = file.name.split(".").pop() || "png";
  const uniqueFileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.${fileExtension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (r2Client && isR2Configured) {
    // Cloudflare R2 Upload
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.type,
      });

      await r2Client.send(command);

      // Clean up trailing slashes in public URL
      const publicUrlBase = process.env.R2_PUBLIC_URL!.endsWith("/")
        ? process.env.R2_PUBLIC_URL!.slice(0, -1)
        : process.env.R2_PUBLIC_URL;

      return `${publicUrlBase}/${uniqueFileName}`;
    } catch (error) {
      console.error("Failed to upload to Cloudflare R2, falling back to local:", error);
      // If R2 upload fails, do not throw, fallback to local so the app continues working
    }
  }

  // Local Storage Fallback
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);
    
    return `/uploads/${uniqueFileName}`;
  } catch (error) {
    console.error("Local file upload fallback failed:", error);
    throw new Error("Gagal mengupload file ke media penyimpanan.");
  }
}
