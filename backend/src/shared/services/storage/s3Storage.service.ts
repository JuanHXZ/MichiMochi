import crypto from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ENV } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface UploadImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({ region: ENV.AWS_REGION });
  }
  return s3Client;
}

export class S3StorageService {
  static getPublicUrl(key: string): string {
    const base =
      ENV.S3_PUBLIC_BASE_URL.replace(/\/+$/, '') ||
      `https://${ENV.S3_BUCKET}.s3.${ENV.AWS_REGION}.amazonaws.com`;
    return `${base}/${key}`;
  }

  static async uploadProductImages(files: UploadImageFile[]): Promise<string[]> {
    if (!ENV.S3_BUCKET) {
      throw AppError.serviceUnavailable(
        'El almacenamiento S3 no está configurado en el servidor (falta S3_BUCKET).'
      );
    }

    if (!files || files.length === 0) {
      throw AppError.badRequest('Debes adjuntar al menos una imagen.');
    }

    const client = getS3Client();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = MIME_TO_EXT[file.mimetype];
      if (!ext) {
        throw AppError.badRequest(
          `Formato de imagen no soportado (${file.mimetype}). Usa JPG, PNG, WebP o GIF.`
        );
      }

      const key = `products/${crypto.randomUUID()}.${ext}`;

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: ENV.S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );
      } catch (err: any) {
        console.error('[S3StorageService] Error subiendo imagen a S3:', err);
        throw AppError.serviceUnavailable(
          `No se pudo subir la imagen "${file.originalname}" a S3: ${err?.message || 'Error desconocido'}`
        );
      }

      uploadedUrls.push(this.getPublicUrl(key));
    }

    return uploadedUrls;
  }
}
