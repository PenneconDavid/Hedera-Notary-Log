'use client';

import { useState } from 'react';

interface HashDisplayProps {
  hash: string;
  label?: string;
  truncate?: boolean;
}

export default function HashDisplay({
  hash,
  label = 'SHA-256 Hash',
  truncate = false,
}: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayHash = truncate
    ? `${hash.slice(0, 16)}...${hash.slice(-16)}`
    : hash;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <code
          className="
            flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg
            font-mono text-sm text-emerald-400 break-all
          "
        >
          {displayHash}
        </code>
        <button
          onClick={handleCopy}
          className="
            p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg
            transition-colors duration-200
            text-zinc-400 hover:text-zinc-200
          "
          title="Copy to clipboard"
        >
          {copied ? (
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

