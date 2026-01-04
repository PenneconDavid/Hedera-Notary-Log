/**
 * MetaMask helpers (client-side)
 */

import { createWalletClient, custom } from 'viem';
import type { ClientSignature, HCSMessagePayload } from '@/types';
import { buildNotaryLogTypedData } from './typedData';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
      on?: (event: string, cb: (...args: any[]) => void) => void;
      removeListener?: (event: string, cb: (...args: any[]) => void) => void;
    };
  }
}

export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export async function requestMetaMaskAccounts(): Promise<`0x${string}`[]> {
  if (!hasMetaMask()) throw new Error('MetaMask not detected');
  const accounts = (await window.ethereum!.request({ method: 'eth_requestAccounts' })) as string[];
  return accounts.map((a) => a as `0x${string}`);
}

export async function getMetaMaskChainId(): Promise<number> {
  if (!hasMetaMask()) throw new Error('MetaMask not detected');
  const chainIdHex = (await window.ethereum!.request({ method: 'eth_chainId' })) as string;
  return parseInt(chainIdHex, 16);
}

export async function ensureChain(chainId: number, rpcUrl?: string): Promise<void> {
  if (!hasMetaMask()) throw new Error('MetaMask not detected');

  const current = await getMetaMaskChainId();
  if (current === chainId) return;

  const hexChainId = `0x${chainId.toString(16)}`;
  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (e: any) {
    // 4902 = Unrecognized chain
    if (e?.code === 4902 && rpcUrl) {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            chainName: chainId === 296 ? 'Hedera Testnet' : `Chain ${chainId}`,
            rpcUrls: [rpcUrl],
            nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
          },
        ],
      });
      return;
    }
    throw e;
  }
}

/**
 * Sign the notarization payload via EIP-712 and return a ClientSignature object.
 *
 * NOTE: This is *identity signing only*; the server still pays fees to submit to HCS.
 */
export async function signNotarizationEip712(args: {
  payload: HCSMessagePayload;
  expectedChainId: number;
  rpcUrlForAddChain?: string;
}): Promise<ClientSignature> {
  if (!hasMetaMask()) throw new Error('MetaMask not detected');

  await ensureChain(args.expectedChainId, args.rpcUrlForAddChain);

  const [account] = await requestMetaMaskAccounts();
  const walletClient = createWalletClient({
    transport: custom(window.ethereum!),
  });

  const typed = buildNotaryLogTypedData(args.payload, args.expectedChainId);

  const signature = await walletClient.signTypedData({
    account,
    domain: typed.domain,
    types: typed.types,
    primaryType: typed.primaryType,
    message: typed.message,
  });

  // Compute payloadHash in-browser to match server expectation.
  // We intentionally hash the typed message JSON (not the raw file).
  const payloadHash = await (async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(typed.message));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  })();

  return {
    wallet: 'MetaMask',
    evmAddress: account,
    scheme: 'EIP712',
    payloadHash,
    sig: signature,
  };
}


