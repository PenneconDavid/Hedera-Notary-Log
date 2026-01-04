/**
 * Unit tests for cryptographic hashing functions
 */

import {
  hashString,
  hashBuffer,
  generateSalt,
  computeCommitment,
  verifyCommitment,
  generateNonce,
  isValidHashFormat,
  formatFileSize,
} from '@/lib/crypto/hash';

describe('Hashing Functions', () => {
  describe('hashString', () => {
    it('should produce consistent hash for same input', async () => {
      const input = 'Hello, World!';
      const hash1 = await hashString(input);
      const hash2 = await hashString(input);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', async () => {
      const hash1 = await hashString('Hello');
      const hash2 = await hashString('Hello!');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex string', async () => {
      const hash = await hashString('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should match known SHA-256 hash', async () => {
      // Known SHA-256 of "hello"
      const hash = await hashString('hello');
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });
  });

  describe('hashBuffer', () => {
    it('should hash ArrayBuffer correctly', async () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode('hello').buffer;
      const hash = await hashBuffer(buffer);
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should produce different hash for different buffer', async () => {
      const encoder = new TextEncoder();
      const buffer1 = encoder.encode('hello').buffer;
      const buffer2 = encoder.encode('world').buffer;
      const hash1 = await hashBuffer(buffer1);
      const hash2 = await hashBuffer(buffer2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSalt', () => {
    it('should generate salt of default length (32 bytes = 64 chars)', () => {
      const salt = generateSalt();
      expect(salt).toHaveLength(64);
      expect(salt).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate salt of specified length', () => {
      const salt = generateSalt(16);
      expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('generateNonce', () => {
    it('should generate 32-character nonce', () => {
      const nonce = generateNonce();
      expect(nonce).toHaveLength(32);
      expect(nonce).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('computeCommitment', () => {
    it('should compute commitment from hash and salt', async () => {
      const hash = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
      const salt = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      const commitment = await computeCommitment(hash, salt);
      expect(commitment).toHaveLength(64);
      expect(commitment).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent commitment for same inputs', async () => {
      const hash = 'abc123';
      const salt = 'def456';
      const commitment1 = await computeCommitment(hash, salt);
      const commitment2 = await computeCommitment(hash, salt);
      expect(commitment1).toBe(commitment2);
    });

    it('should produce different commitment for different salt', async () => {
      const hash = 'abc123';
      const commitment1 = await computeCommitment(hash, 'salt1');
      const commitment2 = await computeCommitment(hash, 'salt2');
      expect(commitment1).not.toBe(commitment2);
    });
  });

  describe('verifyCommitment', () => {
    it('should verify valid commitment', async () => {
      const hash = 'myhash';
      const salt = 'mysalt';
      const commitment = await computeCommitment(hash, salt);
      const isValid = await verifyCommitment(commitment, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject invalid commitment', async () => {
      const commitment = 'invalidcommitment'.padEnd(64, '0');
      const isValid = await verifyCommitment(commitment, 'wrong', 'data');
      expect(isValid).toBe(false);
    });
  });

  describe('isValidHashFormat', () => {
    it('should accept valid SHA-256 hash', () => {
      const validHash = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
      expect(isValidHashFormat(validHash)).toBe(true);
    });

    it('should reject hash with wrong length', () => {
      expect(isValidHashFormat('abc123')).toBe(false);
      expect(isValidHashFormat('a'.repeat(63))).toBe(false);
      expect(isValidHashFormat('a'.repeat(65))).toBe(false);
    });

    it('should reject hash with uppercase letters', () => {
      const hash = '2CF24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
      expect(isValidHashFormat(hash)).toBe(false);
    });

    it('should reject hash with invalid characters', () => {
      const hash = 'g'.repeat(64);
      expect(isValidHashFormat(hash)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});

