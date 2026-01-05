'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { NotarizationReceipt, RevealBundle } from '@/types';
import { clearReceipts, clearRevealBundles, loadReceipts, loadRevealBundles, removeRevealBundle } from '@/lib/storage/history';

function formatIso(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HistoryList() {
  const [receipts, setReceipts] = useState<NotarizationReceipt[]>([]);
  const [bundles, setBundles] = useState<Record<string, RevealBundle>>({});

  useEffect(() => {
    setReceipts(loadReceipts());
    setBundles(loadRevealBundles());
  }, []);

  const hasAny = receipts.length > 0;

  const bundleCount = useMemo(() => Object.keys(bundles).length, [bundles]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">History</h1>
          <p className="text-zinc-400">
            Local receipts stored in this browser. (No server storage.)
          </p>
          {bundleCount > 0 && (
            <p className="mt-2 text-xs text-amber-400">
              Reveal bundles contain salts. Treat this browser/profile as sensitive.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              clearReceipts();
              clearRevealBundles();
              setReceipts([]);
              setBundles({});
            }}
            disabled={!hasAny && bundleCount === 0}
            className="
              px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed
              text-zinc-100 text-sm font-medium rounded-lg transition-colors
            "
          >
            Clear history
          </button>
        </div>
      </div>

      {!hasAny ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-400">No receipts yet.</p>
          <div className="mt-4">
            <Link
              href="/notarize"
              className="
                inline-flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-emerald-500 to-teal-500
                hover:from-emerald-400 hover:to-teal-400
                text-white font-semibold rounded-xl
                transition-all duration-200
              "
            >
              Create your first notarization
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((r) => {
            const verifyHref =
              r.mode === 'commitment'
                ? `/verify?commitment=${r.commitment}`
                : `/verify?hash=${r.hash}`;

            const bundle = r.mode === 'commitment' && r.commitment ? bundles[r.commitment] : undefined;

            return (
              <div key={r.transactionId} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${r.mode === 'commitment'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'}
                        `}
                      >
                        {r.mode === 'commitment' ? 'Private Commitment' : 'Public Hash'}
                      </span>
                      {r.signer?.wallet && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                          {r.signer.wallet}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">{formatIso(r.createdAt)}</span>
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">Topic</p>
                    <code className="text-sm text-zinc-200 font-mono">{r.topicId}</code>

                    <p className="mt-3 text-sm text-zinc-400">Transaction</p>
                    <code className="text-xs text-zinc-300 font-mono break-all">{r.transactionId}</code>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={verifyHref}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-lg transition-colors"
                    >
                      Verify
                    </Link>
                    {r.mode === 'commitment' && r.commitment && (
                      <>
                        {bundle ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `notarylog-reveal-${bundle.createdAt.replace(/[:.]/g, '-')}.json`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-lg transition-colors"
                            >
                              Download bundle
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeRevealBundle(r.commitment!);
                                setBundles(loadRevealBundles());
                              }}
                              className="px-3 py-2 text-zinc-500 hover:text-zinc-300 text-sm"
                              title="Remove stored reveal bundle"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">No stored bundle</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


