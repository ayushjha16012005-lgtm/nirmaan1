import { describe, it, expect } from 'vitest';
import { storageService } from '../src/infrastructure/storage.js';

describe('Storage & File Security Audit', () => {
  it('should accept valid JPEG / PNG document below 5MB', () => {
    const result = storageService.validateFile({
      fileName: 'aadhar_card.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
    expect(result.sanitizedFileName).toBe('aadhar_card.jpg');
  });

  it('should reject executable or unsafe file extensions / MIME types (e.g. .exe, .sh, .html)', () => {
    expect(() =>
      storageService.validateFile({
        fileName: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        sizeBytes: 1024,
      })
    ).toThrowError(/Unsupported file format/);
  });

  it('should reject file exceeding 5MB maximum limit', () => {
    expect(() =>
      storageService.validateFile({
        fileName: 'huge_document.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10 * 1024 * 1024,
      })
    ).toThrowError(/exceeds 5 MB/);
  });

  it('should sanitize filename containing path traversal characters', () => {
    const result = storageService.validateFile({
      fileName: '../../etc/passwd.png',
      mimeType: 'image/png',
      sizeBytes: 50000,
    });
    expect(result.sanitizedFileName).not.toContain('/');
    expect(result.sanitizedFileName).not.toContain('\\');
  });
});
