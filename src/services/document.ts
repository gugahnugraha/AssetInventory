import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
   * Formats S3/R2 CopySource with URL-encoded path segments
   */
  private static formatCopySource(objectKey: string): string {
    const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
    return `${bucketName}/${encodedKey}`;
  }

  /**
   * Extracts raw R2 objectKey from either a `/api/documents?key=...` URL or a raw key
   */
  static extractObjectKeyFromUrl(urlOrKey: string | null | undefined): string | null {
    if (!urlOrKey) return null;
    if (urlOrKey.includes("key=")) {
      try {
        const parsed = new URL(urlOrKey, "http://localhost");
        const key = parsed.searchParams.get("key");
        if (key) return key;
      } catch {
        // Fallback to raw string
      }
    }
    return urlOrKey;
  }

  /**
   * Private helper to validate and compress images to WebP with sharp
   */
  private static async processAndValidateImage(file: File): Promise<{ buffer: Buffer; size: number }> {
    // 1. Validate File size (Max 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error("Ukuran berkas gambar maksimal adalah 5 MB.");
    }

    // 2. Validate MIME type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format berkas tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try dynamic import of sharp for optional compression
    let sharpModule;
    try {
      sharpModule = await import("sharp");
    } catch (importError) {
      console.warn("Sharp image library is not available in this environment. Uploading original image raw without compression:", importError);
      return {
        buffer,
        size: file.size,
      };
    }

    const sharp = sharpModule.default || sharpModule;

    try {
      const processedBuffer = await sharp(buffer)
        .rotate() // preserves EXIF orientation
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 }) // convert to webp with target quality
        .toBuffer();

      return {
        buffer: processedBuffer,
        size: processedBuffer.length,
      };
    } catch (error) {
      console.error("Error processing image with sharp, falling back to raw upload:", error);
      return {
        buffer,
        size: file.size,
      };
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

    // 3. Generate temporary key with sanitized extension
    const rawExt = file.name.includes(".") ? file.name.split(".").pop() : "";
    const cleanExt = (rawExt || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const mimeFallbackExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
    };
    const fileExtension = cleanExt || mimeFallbackExt[file.type] || "bin";
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
        CopySource: this.formatCopySource(tempKey),
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
        isPrimary: false,
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
   * Commits a temporary upload as the primary photo
   */
  static async commitPrimaryPhoto(
    tempKey: string,
    assetId: string,
    userId: string,
    meta: { originalFileName: string; mimeType: string; size: number },
    tx?: any
  ) {
    this.checkConfig();
    const db = tx || prisma;
    const targetKey = this.generateObjectKey(assetId, "PRIMARY");

    // 1. Copy object in R2
    try {
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: this.formatCopySource(tempKey),
        Key: targetKey,
      });
      await r2Client!.send(copyCommand);
    } catch (error) {
      console.error("Failed to copy temporary primary photo in R2:", error);
      throw new Error("Gagal menyimpan foto utama.");
    }

    // 2. Delete temporary object
    await this.deleteFromR2(tempKey);

    // 3. Soft delete existing primary photo in db
    await db.document.updateMany({
      where: {
        entityId: assetId,
        entityType: EntityType.ASSET,
        documentType: DocumentType.PHOTO,
        isPrimary: true,
        archivedAt: null,
      },
      data: { archivedAt: new Date() },
    });

    // 4. Create new Document record for primary photo
    const doc = await db.document.create({
      data: {
        entityType: EntityType.ASSET,
        entityId: assetId,
        documentType: DocumentType.PHOTO,
        bucket: bucketName,
        objectKey: targetKey,
        originalFileName: meta.originalFileName,
        mimeType: "image/webp", // all processed photos are webp
        size: meta.size,
        isPrimary: true,
        uploadedBy: userId,
      },
    });

    // 5. Update the Asset model's fotoUtama field
    await db.asset.update({
      where: { id: assetId },
      data: { fotoUtama: targetKey },
    });

    return doc;
  }

  /**
   * Commits a temporary upload as a detail photo
   */
  static async commitDetailPhoto(
    tempKey: string,
    assetId: string,
    userId: string,
    meta: { originalFileName: string; mimeType: string; size: number },
    tx?: any
  ) {
    this.checkConfig();
    const db = tx || prisma;

    // Find next index
    const docs = await db.document.findMany({
      where: {
        entityId: assetId,
        entityType: EntityType.ASSET,
        documentType: DocumentType.PHOTO,
      },
    });

    let maxIdx = 0;
    for (const doc of docs) {
      const match = doc.objectKey.match(/detail-(\d+)\.webp/);
      if (match) {
        const idx = parseInt(match[1]);
        if (idx > maxIdx) {
          maxIdx = idx;
        }
      }
    }

    const nextIdx = maxIdx + 1;
    const targetKey = this.generateObjectKey(assetId, "DETAIL", nextIdx);

    // 1. Copy object in R2
    try {
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: this.formatCopySource(tempKey),
        Key: targetKey,
      });
      await r2Client!.send(copyCommand);
    } catch (error) {
      console.error("Failed to copy temporary detail photo in R2:", error);
      throw new Error("Gagal menyimpan foto tambahan.");
    }

    // 2. Delete temporary object
    await this.deleteFromR2(tempKey);

    // 3. Create Document record for detail photo
    return await db.document.create({
      data: {
        entityType: EntityType.ASSET,
        entityId: assetId,
        documentType: DocumentType.PHOTO,
        bucket: bucketName,
        objectKey: targetKey,
        originalFileName: meta.originalFileName,
        mimeType: "image/webp",
        size: meta.size,
        isPrimary: false,
        uploadedBy: userId,
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
   * Retrieves a file from R2 as a Buffer and its ContentType
   */
  static async getFileFromR2(objectKey: string): Promise<{ buffer: Buffer; contentType: string }> {
    this.checkConfig();
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      const response = await r2Client!.send(command);
      if (!response.Body) {
        throw new Error("Berkas kosong.");
      }
      
      const bytes = await response.Body.transformToByteArray();
      const buffer = Buffer.from(bytes);
      
      return {
        buffer,
        contentType: response.ContentType || "application/octet-stream",
      };
    } catch (error) {
      console.error(`Failed to get object ${objectKey} from R2:`, error);
      throw new Error("Gagal mengambil berkas dari server penyimpanan.");
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

    return `/api/documents?key=${encodeURIComponent(objectKey)}`;
  }

  // --- NEW ASSET PHOTO SYSTEM METHODS ---

  /**
   * Generates unique immutable object key for asset primary/detail photos
   */
  static generateObjectKey(assetId: string, type: "PRIMARY" | "DETAIL", nextIndex?: number): string {
    const suffix = crypto.randomUUID().slice(0, 8);
    if (type === "PRIMARY") {
      return `assets/${assetId}/primary-${suffix}.webp`;
    }
    const idx = nextIndex || 1;
    return `assets/${assetId}/detail-${String(idx).padStart(3, "0")}-${suffix}.webp`;
  }

  /**
   * Copies temporary asset photos to permanent R2 keys BEFORE DB transaction.
   * Keeps temporary objects intact until the DB transaction succeeds.
   */
  static async copyTemporaryAssetPhotos(
    assetId: string,
    photos: { tempKey: string; originalFileName: string; mimeType: string; size: number; isPrimary: boolean }[],
    startingDetailIndex = 0
  ): Promise<
    {
      tempKey: string;
      bucket: string;
      objectKey: string;
      originalFileName: string;
      mimeType: string;
      size: number;
      isPrimary: boolean;
    }[]
  > {
    if (!photos || photos.length === 0) return [];
    this.checkConfig();

    let nextDetailIdx = startingDetailIndex;
    let primaryAssigned = false;

    const copyTasks = photos.map((p) => {
      const isPrimary = p.isPrimary && !primaryAssigned;
      if (isPrimary) {
        primaryAssigned = true;
      }
      if (!isPrimary) {
        nextDetailIdx += 1;
      }
      const targetKey = isPrimary
        ? this.generateObjectKey(assetId, "PRIMARY")
        : this.generateObjectKey(assetId, "DETAIL", nextDetailIdx);

      return {
        tempKey: p.tempKey,
        bucket: bucketName,
        objectKey: targetKey,
        originalFileName: p.originalFileName,
        mimeType: p.mimeType || "image/webp",
        size: p.size || 0,
        isPrimary,
      };
    });

    const copiedKeys: string[] = [];
    try {
      await Promise.all(
        copyTasks.map(async (item) => {
          const copyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: this.formatCopySource(item.tempKey),
            Key: item.objectKey,
          });
          await r2Client!.send(copyCommand);
          copiedKeys.push(item.objectKey);
        })
      );
      return copyTasks;
    } catch (error) {
      console.error("Failed to copy temporary asset photos in R2:", error);
      // Roll back only newly copied destination keys; keep tempKeys so user can retry
      await Promise.allSettled(copiedKeys.map((key) => this.deleteFromR2(key)));
      throw new Error("Gagal menyimpan foto ke server penyimpanan. Silakan coba simpan kembali.");
    }
  }

  /**
   * Uploads asset primary photo (overwriting previous and archiving database record)
   */
  static async uploadPrimaryPhoto(
    file: File,
    assetId: string,
    userId: string,
    tx?: any
  ) {
    this.checkConfig();
    const db = tx || prisma;

    const { buffer, size } = await this.processAndValidateImage(file);
    const targetKey = this.generateObjectKey(assetId, "PRIMARY");

    // Upload physically to R2 (overwrites if exists)
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: targetKey,
        Body: buffer,
        ContentType: "image/webp",
      });
      await r2Client!.send(command);
    } catch (error) {
      console.error("Failed to upload primary photo to R2:", error);
      throw new Error("Gagal mengunggah foto utama.");
    }

    // Soft delete existing primary photo in db
    await db.document.updateMany({
      where: {
        entityId: assetId,
        entityType: EntityType.ASSET,
        documentType: DocumentType.PHOTO,
        isPrimary: true,
        archivedAt: null,
      },
      data: { archivedAt: new Date() },
    });

    // Save metadata
    const doc = await db.document.create({
      data: {
        entityType: EntityType.ASSET,
        entityId: assetId,
        documentType: DocumentType.PHOTO,
        bucket: bucketName,
        objectKey: targetKey,
        originalFileName: file.name,
        mimeType: "image/webp",
        size,
        isPrimary: true,
        uploadedBy: userId,
      },
    });

    // Update Asset fotoUtama relation field
    await db.asset.update({
      where: { id: assetId },
      data: { fotoUtama: targetKey },
    });

    return doc;
  }

  /**
   * Uploads asset detail photo in sequential order
   */
  static async uploadDetailPhoto(
    file: File,
    assetId: string,
    userId: string,
    tx?: any
  ) {
    this.checkConfig();
    const db = tx || prisma;

    const { buffer, size } = await this.processAndValidateImage(file);

    // Query both active and archived to find highest index used so far
    const docs = await db.document.findMany({
      where: {
        entityId: assetId,
        entityType: EntityType.ASSET,
        documentType: DocumentType.PHOTO,
      },
    });

    let maxIdx = 0;
    for (const doc of docs) {
      const match = doc.objectKey.match(/detail-(\d+)\.webp/);
      if (match) {
        const idx = parseInt(match[1]);
        if (idx > maxIdx) {
          maxIdx = idx;
        }
      }
    }

    const nextIdx = maxIdx + 1;
    const targetKey = this.generateObjectKey(assetId, "DETAIL", nextIdx);

    // Upload physically to R2
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: targetKey,
        Body: buffer,
        ContentType: "image/webp",
      });
      await r2Client!.send(command);
    } catch (error) {
      console.error("Failed to upload detail photo to R2:", error);
      throw new Error("Gagal mengunggah foto tambahan.");
    }

    // Save metadata
    return await db.document.create({
      data: {
        entityType: EntityType.ASSET,
        entityId: assetId,
        documentType: DocumentType.PHOTO,
        bucket: bucketName,
        objectKey: targetKey,
        originalFileName: file.name,
        mimeType: "image/webp",
        size,
        isPrimary: false,
        uploadedBy: userId,
      },
    });
  }

  /**
   * Retrieves active primary photo for an asset
   */
  static async getPrimaryPhoto(assetId: string) {
    return await prisma.document.findFirst({
      where: {
        entityId: assetId,
        entityType: EntityType.ASSET,
        documentType: DocumentType.PHOTO,
        isPrimary: true,
        archivedAt: null,
      },
    });
  }

  /**
   * Retrieves active detail photos for an asset
   */
  static async getDetailPhotos(assetId: string) {
    return await prisma.document.findMany({
      where: {
        entityId: assetId,
        entityType: EntityType.ASSET,
        documentType: DocumentType.PHOTO,
        isPrimary: false,
        archivedAt: null,
      },
      orderBy: { uploadedAt: "asc" },
    });
  }

  /**
   * Soft deletes a photo from the database (does not delete R2 object)
   */
  static async deletePhoto(documentId: string, userId: string, tx?: any) {
    const db = tx || prisma;

    const doc = await db.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throw new Error("Foto tidak ditemukan.");
    }

    const updatedDoc = await db.document.update({
      where: { id: documentId },
      data: { archivedAt: new Date() },
    });

    if (doc.isPrimary) {
      await db.asset.update({
        where: { id: doc.entityId },
        data: { fotoUtama: null },
      });
    }

    return updatedDoc;
  }

  /**
   * Replaces the primary photo using an existing detail photo (swaps isPrimary in DB without overwriting R2 objects)
   */
  static async replacePrimaryPhoto(
    sourcePhotoId: string,
    assetId: string,
    userId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const sourcePhoto = await tx.document.findUnique({
        where: { id: sourcePhotoId },
      });
      if (!sourcePhoto || sourcePhoto.entityId !== assetId || sourcePhoto.archivedAt !== null) {
        throw new Error("Foto detail tidak ditemukan.");
      }

      const oldPrimaryDoc = await tx.document.findFirst({
        where: {
          entityId: assetId,
          entityType: EntityType.ASSET,
          documentType: DocumentType.PHOTO,
          isPrimary: true,
          archivedAt: null,
        },
      });

      // Demote existing primary photo(s) to detail instead of archiving/losing them
      await tx.document.updateMany({
        where: {
          entityId: assetId,
          entityType: EntityType.ASSET,
          documentType: DocumentType.PHOTO,
          archivedAt: null,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });

      // Promote selected photo to primary
      const newPrimaryDoc = await tx.document.update({
        where: { id: sourcePhoto.id },
        data: { isPrimary: true },
      });

      // Update the Asset model's fotoUtama field
      await tx.asset.update({
        where: { id: assetId },
        data: { fotoUtama: sourcePhoto.objectKey },
      });

      // Write to Activity Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          assetId,
          action: "UPDATE",
          oldValue: JSON.stringify({
            message: "Foto utama lama",
            objectKey: oldPrimaryDoc?.objectKey || null,
          }),
          newValue: JSON.stringify({
            message: "Mengganti foto utama menggunakan foto detail",
            objectKey: sourcePhoto.objectKey,
            sourceDetailKey: sourcePhoto.objectKey,
          }),
        },
      });

      return newPrimaryDoc;
    });
  }
}
