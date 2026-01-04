'use client';

import { useState } from 'react';
import type { NotarizationReceipt } from '@/types';

interface ReceiptProps {
  receipt: NotarizationReceipt;
  baseUrl?: string;
}

export default function Receipt({ receipt, baseUrl = '' }: ReceiptProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Build verification link
  const verifyParam = receipt.mode === 'commitment'
    ? `commitment=${receipt.commitment}`
    : `hash=${receipt.hash}`;
  const verifyLink = `${baseUrl}/verify?${verifyParam}`;

  const copyButton = (text: string, field: string) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="ml-2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
      title="Copy"
    >
      {copied === field ? (
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Notarization Receipt</h3>
          <p className="text-sm text-zinc-500">Your document has been anchored to Hedera</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Mode */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500">Mode</span>
          <span className={`
            px-2 py-0.5 rounded text-xs font-medium
            ${receipt.mode === 'commitment'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-blue-500/20 text-blue-400'
            }
          `}>
            {receipt.mode === 'commitment' ? 'Private Commitment' : 'Public Hash'}
          </span>
        </div>

        {/* Hash or Commitment */}
        <div className="py-2 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500 block mb-1">
            {receipt.mode === 'commitment' ? 'Commitment' : 'Hash'}
          </span>
          <div className="flex items-center">
            <code className="text-xs text-emerald-400 font-mono break-all">
              {receipt.mode === 'commitment' ? receipt.commitment : receipt.hash}
            </code>
            {copyButton(
              (receipt.mode === 'commitment' ? receipt.commitment : receipt.hash) || '',
              'hash'
            )}
          </div>
        </div>

        {/* Topic ID */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500">Topic ID</span>
          <div className="flex items-center">
            <code className="text-sm text-zinc-300 font-mono">{receipt.topicId}</code>
            {copyButton(receipt.topicId, 'topic')}
          </div>
        </div>

        {/* Transaction ID */}
        <div className="py-2 border-b border-zinc-800/50">
          <span className="text-sm text-zinc-500 block mb-1">Transaction ID</span>
          <div className="flex items-center">
            <code className="text-xs text-zinc-300 font-mono break-all">{receipt.transactionId}</code>
            {copyButton(receipt.transactionId, 'tx')}
          </div>
        </div>

        {/* Sequence Number */}
        {receipt.sequenceNumber && (
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
            <span className="text-sm text-zinc-500">Sequence #</span>
            <code className="text-sm text-zinc-300 font-mono">{receipt.sequenceNumber}</code>
          </div>
        )}

        {/* Consensus Timestamp */}
        {receipt.consensusTimestamp && (
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
            <span className="text-sm text-zinc-500">Consensus Time</span>
            <code className="text-sm text-zinc-300 font-mono">{receipt.consensusTimestamp}</code>
          </div>
        )}

        {/* Signer */}
        {receipt.signer && (
          <div className="py-2 border-b border-zinc-800/50">
            <span className="text-sm text-zinc-500 block mb-1">Signed By</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                {receipt.signer.wallet}
              </span>
              <code className="text-xs text-zinc-300 font-mono">
                {receipt.signer.accountId || receipt.signer.evmAddress}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Verify Link */}
      <div className="pt-4">
        <label className="text-xs text-zinc-500 block mb-2">Verification Link</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={verifyLink}
            readOnly
            className="
              flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
              text-sm text-zinc-300 font-mono
            "
          />
          {copyButton(verifyLink, 'link')}
        </div>
        <a
          href={verifyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300
            transition-colors
          "
        >
          Open Verification Page
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

