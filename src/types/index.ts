/**
 * Hedera Notary Log - Type Definitions
 * Based on vision.md schema specifications
 */

// =============================================================================
// NOTARIZATION MODES
// =============================================================================

export type NotarizationMode = 'public_hash' | 'commitment';

// =============================================================================
// HCS MESSAGE PAYLOAD (What gets stored on Hedera)
// =============================================================================

/**
 * Content section for public hash mode
 */
export interface PublicHashContent {
  mode: 'public_hash';
  hash: string; // SHA-256 hex, 64 chars, lowercase
  hashAlg: 'SHA-256';
}

/**
 * Content section for private commitment mode
 */
export interface CommitmentContent {
  mode: 'commitment';
  commitment: string; // Commitment hex
  commitmentAlg: 'POSEIDON2_BN254' | 'SHA256_SALTED';
  hashAlg: 'SHA-256';
}

export type PayloadContent = PublicHashContent | CommitmentContent;

/**
 * Optional file metadata
 */
export interface FileMetadata {
  size: number;
  name?: string;
  mime?: string;
}

/**
 * Message metadata
 */
export interface MessageMeta {
  note?: string;
  clientTs: string; // ISO timestamp
  app: 'notarylog';
  appVersion: string;
  env: 'testnet' | 'mainnet';
  nonce: string;
}

/**
 * Wallet signature information
 */
export interface SignatureInfo {
  scheme: 'EIP712' | 'personal_sign' | 'hedera_raw';
  signedAt: string; // ISO timestamp
  payloadHash: string; // hex
  sig: string; // 0x... signature bytes
}

/**
 * Signer information (when wallet is connected)
 */
export interface SignerInfo {
  wallet: 'HashPack' | 'MetaMask';
  accountId?: string; // 0.0.x format
  evmAddress?: string; // 0x... format
  signature: SignatureInfo;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  minimalMetadata: boolean;
}

/**
 * Complete HCS message payload
 */
export interface HCSMessagePayload {
  schema: 'notarylog@2';
  content: PayloadContent;
  file?: FileMetadata;
  meta: MessageMeta;
  signer?: SignerInfo;
  privacy?: PrivacySettings;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Client signature for notarization request
 */
export interface ClientSignature {
  wallet: 'HashPack' | 'MetaMask';
  accountId?: string;
  evmAddress?: string;
  scheme: 'EIP712' | 'personal_sign' | 'hedera_raw';
  payloadHash: string;
  sig: string;
}

/**
 * POST /api/notarize request body
 */
export interface NotarizeRequest {
  payload: HCSMessagePayload;
  clientSignature?: ClientSignature;
}

/**
 * POST /api/notarize response
 */
export interface NotarizeResponse {
  ok: boolean;
  topicId: string;
  transactionId: string;
  sequenceNumber?: number;
  consensusTimestamp?: string;
  error?: string;
}

/**
 * GET /api/verify response - single match
 */
export interface VerifyMatch {
  topicId: string;
  sequenceNumber: number;
  consensusTimestamp: string;
  message: HCSMessagePayload;
  signatureValid?: boolean;
}

/**
 * GET /api/verify response
 */
export interface VerifyResponse {
  ok: boolean;
  found: boolean;
  matches: VerifyMatch[];
  error?: string;
}

// =============================================================================
// RECEIPT FORMAT (What the UI shows/saves)
// =============================================================================

/**
 * Mirror lookup hint for verification
 */
export interface MirrorLookup {
  topicId: string;
  queryHint: string; // e.g., "hash=<sha256_hex>"
}

/**
 * Notarization receipt
 */
export interface NotarizationReceipt {
  mode: NotarizationMode;
  hash?: string; // public_hash mode only
  commitment?: string; // commitment mode only
  topicId: string;
  transactionId: string;
  sequenceNumber?: number;
  consensusTimestamp?: string;
  mirrorLookup: MirrorLookup;
  createdAt: string; // ISO timestamp
  signer?: {
    wallet: string;
    accountId?: string;
    evmAddress?: string;
  };
}

// =============================================================================
// REVEAL BUNDLE (For private commitment mode)
// =============================================================================

/**
 * Reveal bundle for private commitment verification
 */
export interface RevealBundle {
  version: '1.0';
  hash: string; // Original file hash
  salt: string; // Random salt used
  commitment: string; // Resulting commitment
  commitmentAlg: 'POSEIDON2_BN254' | 'SHA256_SALTED';
  createdAt: string;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export type NotarizeStatus = 
  | 'idle'
  | 'hashing'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'error';

export type VerifyStatus =
  | 'idle'
  | 'searching'
  | 'found'
  | 'not_found'
  | 'error';

/**
 * File information for UI display
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  hash?: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate SHA-256 hash format
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

/**
 * Validate commitment format (less strict, just hex)
 */
export function isValidCommitment(commitment: string): boolean {
  return /^[a-f0-9]+$/.test(commitment) && commitment.length >= 32;
}

/**
 * Validate Hedera account ID format
 */
export function isValidAccountId(accountId: string): boolean {
  return /^0\.0\.\d+$/.test(accountId);
}

/**
 * Validate Hedera topic ID format
 */
export function isValidTopicId(topicId: string): boolean {
  return /^0\.0\.\d+$/.test(topicId);
}

