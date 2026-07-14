import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
 * Uploads a file to Cloudflare R2
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

  if (!r2Client || !isR2Configured) {
    throw new Error("Gagal mengunggah foto. Sistem penyimpanan belum siap.");
  }

  const fileExtension = file.name.split(".").pop() || "png";
  const uniqueFileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}.${fileExtension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

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
  } catch (error: any) {
    console.error("Failed to upload to Cloudflare R2:", error);
    throw new Error("Gagal mengunggah foto. Terjadi kendala pada server penyimpanan.");
  }
}
