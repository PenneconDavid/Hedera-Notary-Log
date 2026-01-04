/**
 * Unit tests for payload validation
 */

import { validatePayload } from '@/lib/hedera/hcs';
import type { HCSMessagePayload } from '@/types';
import { isValidHash, isValidCommitment, isValidAccountId, isValidTopicId } from '@/types';

describe('Payload Validation', () => {
  const validPublicHashPayload: HCSMessagePayload = {
    schema: 'notarylog@2',
    content: {
      mode: 'public_hash',
      hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      hashAlg: 'SHA-256',
    },
    file: {
      size: 1024,
      name: 'test.pdf',
      mime: 'application/pdf',
    },
    meta: {
      clientTs: '2024-01-01T00:00:00.000Z',
      app: 'notarylog',
      appVersion: '0.2.0',
      env: 'testnet',
      nonce: 'abc123def456',
    },
    privacy: {
      minimalMetadata: false,
    },
  };

  const validCommitmentPayload: HCSMessagePayload = {
    schema: 'notarylog@2',
    content: {
      mode: 'commitment',
      commitment: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      commitmentAlg: 'SHA256_SALTED',
      hashAlg: 'SHA-256',
    },
    meta: {
      clientTs: '2024-01-01T00:00:00.000Z',
      app: 'notarylog',
      appVersion: '0.2.0',
      env: 'testnet',
      nonce: 'abc123def456',
    },
  };

  describe('validatePayload', () => {
    it('should accept valid public hash payload', () => {
      const result = validatePayload(validPublicHashPayload);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid commitment payload', () => {
      const result = validatePayload(validCommitmentPayload);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null payload', () => {
      const result = validatePayload(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payload must be an object');
    });

    it('should reject payload with wrong schema', () => {
      const payload = { ...validPublicHashPayload, schema: 'notarylog@1' };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('schema');
    });

    it('should reject payload without content', () => {
      const payload = { schema: 'notarylog@2', meta: validPublicHashPayload.meta };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('content');
    });

    it('should reject payload with invalid hash format', () => {
      const payload = {
        ...validPublicHashPayload,
        content: {
          mode: 'public_hash' as const,
          hash: 'invalid',
          hashAlg: 'SHA-256' as const,
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('hash');
    });

    it('should reject payload with uppercase hash', () => {
      const payload = {
        ...validPublicHashPayload,
        content: {
          mode: 'public_hash' as const,
          hash: '2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824',
          hashAlg: 'SHA-256' as const,
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('hash');
    });

    it('should reject payload with wrong hash algorithm', () => {
      const payload = {
        ...validPublicHashPayload,
        content: {
          mode: 'public_hash' as const,
          hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
          hashAlg: 'MD5',
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('algorithm');
    });

    it('should reject payload with invalid mode', () => {
      const payload = {
        ...validPublicHashPayload,
        content: {
          mode: 'invalid',
          hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mode');
    });

    it('should reject payload without app identifier', () => {
      const payload = {
        ...validPublicHashPayload,
        meta: {
          ...validPublicHashPayload.meta,
          app: 'wrongapp',
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('app');
    });

    it('should reject commitment with too short length', () => {
      const payload = {
        ...validCommitmentPayload,
        content: {
          mode: 'commitment' as const,
          commitment: 'abc',
          commitmentAlg: 'SHA256_SALTED' as const,
          hashAlg: 'SHA-256' as const,
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Commitment');
    });

    it('should reject payload with negative file size', () => {
      const payload = {
        ...validPublicHashPayload,
        file: {
          size: -100,
        },
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('file size');
    });

    it('should accept payload without optional file metadata', () => {
      const payload = {
        schema: 'notarylog@2',
        content: validPublicHashPayload.content,
        meta: validPublicHashPayload.meta,
      };
      const result = validatePayload(payload);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Type Validators', () => {
  describe('isValidHash', () => {
    it('should accept valid hash', () => {
      expect(isValidHash('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toBe(true);
    });

    it('should reject invalid hash', () => {
      expect(isValidHash('invalid')).toBe(false);
      expect(isValidHash('')).toBe(false);
    });
  });

  describe('isValidCommitment', () => {
    it('should accept valid commitment', () => {
      expect(isValidCommitment('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toBe(true);
      expect(isValidCommitment('abcdef1234567890abcdef1234567890')).toBe(true);
    });

    it('should reject invalid commitment', () => {
      expect(isValidCommitment('short')).toBe(false);
      expect(isValidCommitment('')).toBe(false);
    });
  });

  describe('isValidAccountId', () => {
    it('should accept valid account ID', () => {
      expect(isValidAccountId('0.0.123456')).toBe(true);
      expect(isValidAccountId('0.0.1')).toBe(true);
    });

    it('should reject invalid account ID', () => {
      expect(isValidAccountId('123456')).toBe(false);
      expect(isValidAccountId('0.0.')).toBe(false);
      expect(isValidAccountId('0.0.abc')).toBe(false);
    });
  });

  describe('isValidTopicId', () => {
    it('should accept valid topic ID', () => {
      expect(isValidTopicId('0.0.789012')).toBe(true);
    });

    it('should reject invalid topic ID', () => {
      expect(isValidTopicId('invalid')).toBe(false);
    });
  });
});

