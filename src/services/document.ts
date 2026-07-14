import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "./db";
import { EntityType, DocumentType } from "@prisma/client";

// Verify environment variables for R2
const isR2Configured =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME &&
  process.env.R2_PUBLIC_URL;

const bucketName = process.env.R2_BUCKET_NAME || "inventoria";

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

export class DocumentService {
  /**
   * Helper to ensure R2 is configured
   */
  private static checkConfig() {
    if (!r2Client || !isR2Configured) {
      throw new Error("Sistem penyimpanan Cloudflare R2 belum dikonfigurasi dengan benar.");
    }
  }

  /**
   * Uploads a file to temporary/ folder on Cloudflare R2
   */
  static async uploadTemporaryFile(
    file: File
  ): Promise<{
    bucket: string;
    objectKey: string;
    originalFileName: string;
    mimeType: string;
    size: number;
  }> {
    this.checkConfig();

    // 1. Validate File size (Max 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error("Ukuran berkas maksimal adalah 5 MB.");
    }

    // 2. Validate MIME type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf"
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format file tidak didukung. Gunakan JPG, JPEG, PNG, WEBP, atau PDF.");
    }

    // 3. Generate temporary key
    const fileExtension = file.name.split(".").pop() || "bin";
    const tempUuid = crypto.randomUUID();
    const objectKey = `temporary/${tempUuid}.${fileExtension}`;

    // 4. Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
      });

      await r2Client!.send(command);

      return {
        bucket: bucketName,
        objectKey,
        originalFileName: file.name,
        mimeType: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error("Failed to upload temporary file to R2:", error);
      throw new Error("Gagal mengunggah berkas ke server penyimpanan.");
    }
  }

  /**
   * Deletes a file physically from R2 (e.g. when transaction fails)
   */
  static async deleteFromR2(objectKey: string): Promise<void> {
    this.checkConfig();
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      await r2Client!.send(command);
    } catch (error) {
      console.error(`Failed to delete object ${objectKey} from R2:`, error);
    }
  }

  /**
   * Commits a temporary file by copying it to its final path and saving it to db
   */
  static async commitDocument(
    tempKey: string,
    targetKey: string,
    meta: {
      entityType: EntityType;
      entityId: string;
      documentType: DocumentType;
      originalFileName: string;
      mimeType: string;
      size: number;
      userId: string;
    },
    tx?: any
  ): Promise<any> {
    this.checkConfig();

    // 1. Copy object from temporary path to target path in R2
    try {
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${tempKey}`,
        Key: targetKey,
      });
      await r2Client!.send(copyCommand);
    } catch (error) {
      console.error(`Failed to copy R2 object from ${tempKey} to ${targetKey}:`, error);
      throw new Error("Gagal memindahkan berkas di server penyimpanan.");
    }

    // 2. Delete temporary object from R2
    await this.deleteFromR2(tempKey);

    // 3. Save to database (uses transactional client if provided)
    const db = tx || prisma;
    return await db.document.create({
      data: {
        entityType: meta.entityType,
        entityId: meta.entityId,
        documentType: meta.documentType,
        bucket: bucketName,
        objectKey: targetKey,
        originalFileName: meta.originalFileName,
        mimeType: meta.mimeType,
        size: meta.size,
        uploadedBy: meta.userId,
      },
    });
  }

  /**
   * Soft deletes a document by setting archivedAt
   */
  static async archiveDocument(documentId: string, userId: string, tx?: any): Promise<any> {
    const db = tx || prisma;
    return await db.document.update({
      where: { id: documentId },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves active documents for an entity
   */
  static async getDocuments(
    entityId: string,
    entityType: EntityType,
    documentType?: DocumentType
  ) {
    try {
      return await prisma.document.findMany({
        where: {
          entityId,
          entityType,
          documentType,
          archivedAt: null,
        },
        orderBy: { uploadedAt: "desc" },
      });
    } catch (error) {
      console.error("Error in getDocuments:", error);
      throw new Error("Gagal mengambil data dokumen.");
    }
  }

  /**
   * Generates public URL for a file
   */
  static generateFileUrl(objectKey: string | null): string {
    if (!objectKey) return "/placeholder-asset.png";
    
    // If it's already a full URL, return it
    if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
      return objectKey;
    }

    const publicUrlBase = process.env.R2_PUBLIC_URL || "";
    const cleanBase = publicUrlBase.endsWith("/") ? publicUrlBase.slice(0, -1) : publicUrlBase;
    
    return `${cleanBase}/${objectKey}`;
  }
}
