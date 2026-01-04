/**
 * Unit tests for EIP-712 signature verification (server-side)
 */

import { privateKeyToAccount } from 'viem/accounts';
import type { HCSMessagePayload } from '@/types';
import { buildNotaryLogTypedData } from '@/lib/wallet/typedData';
import { computeSigningPayloadHash, verifyClientSignatureEip712 } from '@/lib/wallet/serverVerify';

describe('EIP-712 signature verification', () => {
  it('verifies a valid MetaMask-style EIP-712 signature', async () => {
    const chainId = 296;
    const account = privateKeyToAccount('0x' + '11'.repeat(32));

    const payload: HCSMessagePayload = {
      schema: 'notarylog@2',
      content: {
        mode: 'public_hash',
        hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        hashAlg: 'SHA-256',
      },
      meta: {
        clientTs: '2026-01-04T00:00:00.000Z',
        app: 'notarylog',
        appVersion: '0.2.0',
        env: 'testnet',
        nonce: 'a'.repeat(32),
      },
      privacy: { minimalMetadata: false },
    };

    const typed = buildNotaryLogTypedData(payload, chainId);
    const signature = await account.signTypedData({
      domain: typed.domain,
      types: typed.types,
      primaryType: typed.primaryType,
      message: typed.message,
    });

    const payloadHash = computeSigningPayloadHash(payload, chainId);

    const result = await verifyClientSignatureEip712({
      payload,
      clientSignature: {
        wallet: 'MetaMask',
        evmAddress: account.address,
        scheme: 'EIP712',
        payloadHash,
        sig: signature,
      },
      chainId,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recoveredAddress.toLowerCase()).toBe(account.address.toLowerCase());
      expect(result.payloadHash).toBe(payloadHash);
    }
  });
});


