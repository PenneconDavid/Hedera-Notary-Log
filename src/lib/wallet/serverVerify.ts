/**
 * Server-side helpers for verifying EIP-712 signatures.
 *
 * Uses viem to recover the signing address from typed data + signature.
 */

import { createHash } from 'crypto';
import { recoverTypedDataAddress } from 'viem';
import type { ClientSignature, HCSMessagePayload } from '@/types';
import { buildNotaryLogTypedData } from './typedData';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function computeSigningPayloadHash(payload: HCSMessagePayload, chainId: number): string {
  const typed = buildNotaryLogTypedData(payload, chainId);
  // Deterministic JSON string of the EIP-712 "message" payload is enough here,
  // since the signature itself is verified against full typed data.
  return sha256Hex(JSON.stringify(typed.message));
}

export async function verifyClientSignatureEip712(args: {
  payload: HCSMessagePayload;
  clientSignature: ClientSignature;
  chainId: number;
}): Promise<{ ok: true; recoveredAddress: `0x${string}`; payloadHash: string } | { ok: false; error: string }> {
  const { payload, clientSignature, chainId } = args;

  if (clientSignature.wallet !== 'MetaMask') {
    return { ok: false, error: 'Unsupported wallet (expected MetaMask)' };
  }
  if (clientSignature.scheme !== 'EIP712') {
    return { ok: false, error: 'Unsupported signature scheme (expected EIP712)' };
  }
  if (!clientSignature.evmAddress) {
    return { ok: false, error: 'Missing evmAddress in clientSignature' };
  }
  if (!clientSignature.sig?.startsWith('0x')) {
    return { ok: false, error: 'Invalid signature format' };
  }

  const expectedPayloadHash = computeSigningPayloadHash(payload, chainId);
  if (clientSignature.payloadHash !== expectedPayloadHash) {
    return { ok: false, error: 'payloadHash mismatch (tampered payload or wrong signing data)' };
  }

  const typed = buildNotaryLogTypedData(payload, chainId);

  try {
    const recovered = await recoverTypedDataAddress({
      domain: typed.domain,
      types: typed.types,
      primaryType: typed.primaryType,
      message: typed.message,
      signature: clientSignature.sig as `0x${string}`,
    });

    if (recovered.toLowerCase() !== clientSignature.evmAddress.toLowerCase()) {
      return { ok: false, error: 'Signature does not match evmAddress' };
    }

    return { ok: true, recoveredAddress: recovered, payloadHash: expectedPayloadHash };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to verify signature' };
  }
}


