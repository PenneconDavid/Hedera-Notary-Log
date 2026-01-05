/**
 * Local receipt history utilities (browser-only).
 *
 * Design:
 * - Always store receipts (A)
 * - Optionally store reveal bundles (B) behind explicit opt-in (contains salt)
 */

import type { NotarizationReceipt, RevealBundle } from '@/types';

const RECEIPTS_KEY = 'notarylog:receipts:v1';
const REVEAL_BUNDLES_KEY = 'notarylog:revealBundles:v1';
const MAX_RECEIPTS = 25;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadReceipts(): NotarizationReceipt[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECEIPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NotarizationReceipt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReceipt(receipt: NotarizationReceipt): void {
  if (!isBrowser()) return;
  const existing = loadReceipts();

  // De-dupe by transactionId if present, else by mirrorLookup hint
  const deduped = existing.filter((r) => r.transactionId !== receipt.transactionId);
  const next = [receipt, ...deduped].slice(0, MAX_RECEIPTS);

  window.localStorage.setItem(RECEIPTS_KEY, JSON.stringify(next));
}

export function clearReceipts(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(RECEIPTS_KEY);
}

export function loadRevealBundles(): Record<string, RevealBundle> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(REVEAL_BUNDLES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RevealBundle>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Save a reveal bundle keyed by commitment.
 * WARNING: This contains the salt and should be opt-in.
 */
export function saveRevealBundle(bundle: RevealBundle): void {
  if (!isBrowser()) return;
  const existing = loadRevealBundles();
  existing[bundle.commitment] = bundle;
  window.localStorage.setItem(REVEAL_BUNDLES_KEY, JSON.stringify(existing));
}

export function removeRevealBundle(commitment: string): void {
  if (!isBrowser()) return;
  const existing = loadRevealBundles();
  delete existing[commitment];
  window.localStorage.setItem(REVEAL_BUNDLES_KEY, JSON.stringify(existing));
}

export function clearRevealBundles(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(REVEAL_BUNDLES_KEY);
}


