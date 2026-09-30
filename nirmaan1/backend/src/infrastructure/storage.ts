import { AppError, ErrorCode } from '../utils/errors.js';

export interface UploadedFileValidation {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  buffer?: Buffer;
}

export class StorageService {
  private allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  private maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

  validateFile(file: UploadedFileValidation) {
    if (!file.fileName || typeof file.fileName !== 'string') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid file name', 400);
    }

    if (!this.allowedMimeTypes.includes(file.mimeType.toLowerCase())) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Unsupported file format: ${file.mimeType}. Allowed formats: JPEG, PNG, WEBP, PDF`,
        400
      );
    }

    if (file.sizeBytes > this.maxFileSizeBytes) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `File size exceeds 5 MB maximum limit (${(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB)`,
        400
      );
    }

    // Sanitize file name
    const sanitizedFileName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return {
      sanitizedFileName,
      valid: true,
    };
  }

  generateSecurePrivateUrl(filePath: string, expiresInMinutes = 15): string {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    return `/api/v1/storage/private?path=${encodeURIComponent(filePath)}&expires=${expiresAt}`;
  }
}

export const storageService = new StorageService();
