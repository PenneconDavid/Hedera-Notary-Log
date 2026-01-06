'use client';

import type { VerifyMatch } from '@/types';

interface VerifyResultProps {
  found: boolean;
  matches: VerifyMatch[];
  searchTerm: string;
  mode: 'hash' | 'commitment';
}

/**
 * Format Hedera consensus timestamp to human-readable date
 */
function formatTimestamp(timestamp: string): string {
  try {
    const [seconds] = timestamp.split('.');
    const date = new Date(parseInt(seconds) * 1000);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

export default function VerifyResult({ found, matches, searchTerm, mode }: VerifyResultProps) {
  const mirrorBaseUrl =
    process.env.NEXT_PUBLIC_MIRROR_NODE_BASE_URL ||
    (process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com');

  if (!found) {
    return (
      <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Not Found</h3>
            <p className="text-sm text-zinc-500">
              No matching {mode === 'commitment' ? 'commitment' : 'hash'} found on Hedera
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
          <p className="text-sm text-zinc-400 mb-2">Searched for:</p>
          <code className="text-xs text-zinc-500 font-mono break-all">{searchTerm}</code>
        </div>
        <div className="mt-4 text-sm text-zinc-500">
          <p>This could mean:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>The document was never notarized</li>
            <li>The document was modified after notarization</li>
            <li>The {mode} was entered incorrectly</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Success Header */}
      <div className="bg-zinc-900/80 border border-emerald-800/50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Verified!</h3>
            <p className="text-sm text-zinc-500">
              Found {matches.length} matching record{matches.length > 1 ? 's' : ''} on Hedera
            </p>
          </div>
        </div>
      </div>

      {/* Match Details */}
      {matches.map((match, index) => (
        <div
          key={`${match.topicId}-${match.sequenceNumber}`}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6"
        >
          {matches.length > 1 && (
            <div className="text-xs text-zinc-500 mb-4">Match #{index + 1}</div>
          )}

          <div className="space-y-3">
            {/* Explorer Links */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-500">Explorer</span>
              <div className="flex items-center gap-3">
                <a
                  href={`${mirrorBaseUrl}/api/v1/topics/${match.topicId}/messages/${match.sequenceNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Message
                </a>
                <a
                  href={`${mirrorBaseUrl}/api/v1/topics/${match.topicId}/messages?order=desc&limit=25`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Topic
                </a>
              </div>
            </div>

            {/* Consensus Timestamp */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-500">Consensus Time</span>
              <div className="text-right">
                <span className="text-sm text-zinc-300">{formatTimestamp(match.consensusTimestamp)}</span>
                <code className="block text-xs text-zinc-500 font-mono mt-1">
                  {match.consensusTimestamp}
                </code>
              </div>
            </div>

            {/* Sequence Number */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-500">Sequence #</span>
              <code className="text-sm text-zinc-300 font-mono">{match.sequenceNumber}</code>
            </div>

            {/* Topic ID */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-500">Topic ID</span>
              <code className="text-sm text-zinc-300 font-mono">{match.topicId}</code>
            </div>

            {/* Mode */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-500">Mode</span>
              <span className={`
                px-2 py-0.5 rounded text-xs font-medium
                ${match.message.content.mode === 'commitment'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-blue-500/20 text-blue-400'
                }
              `}>
                {match.message.content.mode === 'commitment' ? 'Private Commitment' : 'Public Hash'}
              </span>
            </div>

            {/* Stored Hash/Commitment */}
            <div className="py-2 border-b border-zinc-800/50">
              <span className="text-sm text-zinc-500 block mb-1">
                Stored {match.message.content.mode === 'commitment' ? 'Commitment' : 'Hash'}
              </span>
              <code className="text-xs text-emerald-400 font-mono break-all">
                {match.message.content.mode === 'commitment'
                  ? match.message.content.commitment
                  : match.message.content.hash
                }
              </code>
            </div>

            {/* File Info */}
            {match.message.file && (
              <div className="py-2 border-b border-zinc-800/50">
                <span className="text-sm text-zinc-500 block mb-1">File Info</span>
                <div className="text-sm text-zinc-300">
                  {match.message.file.name && <span>{match.message.file.name}</span>}
                  {match.message.file.size && (
                    <span className="text-zinc-500 ml-2">
                      ({(match.message.file.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Signer Info */}
            {match.message.signer && (
              <div className="py-2 border-b border-zinc-800/50">
                <span className="text-sm text-zinc-500 block mb-1">Signed By</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                    {match.message.signer.wallet}
                  </span>
                  <code className="text-xs text-zinc-300 font-mono">
                    {match.message.signer.accountId || match.message.signer.evmAddress}
                  </code>
                  {match.signatureValid !== undefined && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded
                      ${match.signatureValid
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                      }
                    `}>
                      {match.signatureValid ? 'Valid' : 'Invalid'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* App Version */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-500">App Version</span>
              <code className="text-sm text-zinc-500 font-mono">
                {match.message.meta?.appVersion || 'Unknown'}
              </code>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

