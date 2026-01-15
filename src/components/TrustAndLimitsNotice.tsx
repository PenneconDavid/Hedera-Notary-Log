'use client';

import Link from 'next/link';

interface TrustAndLimitsNoticeProps {
  variant?: 'compact' | 'full';
}

export default function TrustAndLimitsNotice({ variant = 'full' }: TrustAndLimitsNoticeProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-100">What this proves (and what it doesn’t)</h3>
          <p className="text-sm text-zinc-500 mt-1">
            This app is “proof-of-existence” tooling — not legal notarization.
          </p>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-200 mb-2">It can prove</p>
              <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                <li>A specific hash/commitment was anchored to Hedera at/around a consensus time.</li>
                <li>The record is tamper-evident (any change to the stored value won’t match).</li>
                <li>If MetaMask signing is used, which EVM address signed the notarization payload.</li>
              </ul>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-200 mb-2">It does not prove</p>
              <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                <li>Authorship, ownership, intent, or legal validity.</li>
                <li>The document’s contents (only hash/commitment is anchored).</li>
                <li>That the signer is a real-world identity (only an address), unless you add identity checks externally.</li>
              </ul>
            </div>
          </div>

          {variant === 'full' && (
            <div className="mt-4 bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-200 mb-2">Threat model (practical)</p>
              <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                <li>
                  <span className="text-zinc-300">File tampering:</span> any change to the file changes its hash → verify fails.
                </li>
                <li>
                  <span className="text-zinc-300">Topic mismatch:</span> verifying against the wrong topic will yield “not found.”
                </li>
                <li>
                  <span className="text-zinc-300">Private commitment salt loss:</span> if you lose the salt/reveal bundle, you may not be able to prove a match later.
                </li>
                <li>
                  <span className="text-zinc-300">Local storage risk:</span> saving reveal bundles locally is convenient but anyone with access to this browser profile may retrieve the salt.
                </li>
                <li>
                  <span className="text-zinc-300">Search depth limits:</span> verify scans a bounded number of pages; raise “Search depth” for older entries.
                </li>
              </ul>
              <div className="mt-3">
                <Link href="/whitepaper" className="text-sm text-emerald-400 hover:text-emerald-300">
                  Read the full white paper →
                </Link>
              </div>
            </div>
          )}

          {variant === 'compact' && (
            <div className="mt-3">
              <Link href="/whitepaper" className="text-sm text-emerald-400 hover:text-emerald-300">
                Read the full white paper →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

