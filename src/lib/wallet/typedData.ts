/**
 * EIP-712 typed data for Notary Log notarizations.
 *
 * This is shared between client (MetaMask signing) and server (signature verification).
 */

import type { HCSMessagePayload, NotarizationMode } from '@/types';

export const NOTARYLOG_PRIMARY_TYPE = 'Notarization' as const;

export type NotaryLogTypedDataMessage = {
  schema: 'notarylog@2';
  mode: NotarizationMode;
  value: `0x${string}`; // bytes32 for both hash and commitment (we store SHA-256 based values in MVP)
  hashAlg: 'SHA-256';
  commitmentAlg: string; // '' for public_hash
  nonce: `0x${string}`; // bytes16 (our nonce is 16 bytes / 32 hex chars)
  clientTs: string;
  app: 'notarylog';
  appVersion: string;
  env: 'testnet' | 'mainnet';
  minimalMetadata: boolean;
};

export type NotaryLogTypedData = {
  domain: {
    name: 'NotaryLog';
    version: '2';
    chainId: number;
  };
  types: {
    Notarization: ReadonlyArray<{ name: string; type: string }>;
  };
  primaryType: typeof NOTARYLOG_PRIMARY_TYPE;
  message: NotaryLogTypedDataMessage;
};

export const NOTARYLOG_TYPES = {
  Notarization: [
    { name: 'schema', type: 'string' },
    { name: 'mode', type: 'string' },
    { name: 'value', type: 'bytes32' },
    { name: 'hashAlg', type: 'string' },
    { name: 'commitmentAlg', type: 'string' },
    { name: 'nonce', type: 'bytes16' },
    { name: 'clientTs', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'appVersion', type: 'string' },
    { name: 'env', type: 'string' },
    { name: 'minimalMetadata', type: 'bool' },
  ],
} as const;

export function to0xBytes32(hexLowerNo0x: string): `0x${string}` {
  const h = hexLowerNo0x.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(h)) {
    throw new Error('Expected 32-byte hex string (64 lowercase hex chars)');
  }
  return `0x${h}` as const;
}

export function to0xBytes16(hexLowerNo0x: string): `0x${string}` {
  const h = hexLowerNo0x.trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(h)) {
    throw new Error('Expected 16-byte hex string (32 lowercase hex chars)');
  }
  return `0x${h}` as const;
}

/**
 * Build the EIP-712 typed data for a notarization payload.
 *
 * We sign a *stable subset* of the payload: content + meta.nonce/clientTs/app/appVersion/env + privacy.minimalMetadata.
 * We intentionally exclude file.name/mime/note for privacy and stability.
 */
export function buildNotaryLogTypedData(
  payload: HCSMessagePayload,
  chainId: number
): NotaryLogTypedData {
  const minimalMetadata = payload.privacy?.minimalMetadata ?? false;

  const mode = payload.content.mode;
  const value =
    mode === 'commitment'
      ? to0xBytes32(payload.content.commitment)
      : to0xBytes32(payload.content.hash);

  const commitmentAlg = mode === 'commitment' ? payload.content.commitmentAlg : '';

  const message: NotaryLogTypedDataMessage = {
    schema: payload.schema,
    mode,
    value,
    hashAlg: 'SHA-256',
    commitmentAlg,
    nonce: to0xBytes16(payload.meta.nonce),
    clientTs: payload.meta.clientTs,
    app: payload.meta.app,
    appVersion: payload.meta.appVersion,
    env: payload.meta.env,
    minimalMetadata,
  };

  return {
    domain: {
      name: 'NotaryLog',
      version: '2',
      chainId,
    },
    types: NOTARYLOG_TYPES,
    primaryType: NOTARYLOG_PRIMARY_TYPE,
    message,
  };
}


