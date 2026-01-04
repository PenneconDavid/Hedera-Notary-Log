'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FileDropzone from '@/components/FileDropzone';
import HashDisplay from '@/components/HashDisplay';
import VerifyResult from '@/components/VerifyResult';
import { hashFile, isValidHashFormat } from '@/lib/crypto/hash';
import type { VerifyStatus, VerifyMatch, VerifyResponse } from '@/types';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [inputMode, setInputMode] = useState<'file' | 'hash'>('file');
  const [hashInput, setHashInput] = useState('');
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [matches, setMatches] = useState<VerifyMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check for URL params on mount
  useEffect(() => {
    const hashParam = searchParams.get('hash');
    const commitmentParam = searchParams.get('commitment');

    if (hashParam) {
      setHashInput(hashParam);
      setInputMode('hash');
      // Auto-verify
      verifyHash(hashParam);
    } else if (commitmentParam) {
      setHashInput(commitmentParam);
      setInputMode('hash');
      // Auto-verify commitment
      verifyCommitment(commitmentParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyHash = useCallback(async (hash: string) => {
    const normalizedHash = hash.toLowerCase().trim();

    if (!isValidHashFormat(normalizedHash)) {
      setError('Invalid hash format. Expected 64 lowercase hexadecimal characters.');
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('searching');
    setMatches([]);

    try {
      const response = await fetch(`/api/verify?hash=${normalizedHash}`);
      const data: VerifyResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setMatches(data.matches);
      setStatus(data.found ? 'found' : 'not_found');
    } catch (err) {
      console.error('Verify error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, []);

  const verifyCommitment = useCallback(async (commitment: string) => {
    const normalizedCommitment = commitment.toLowerCase().trim();

    setError(null);
    setStatus('searching');
    setMatches([]);

    try {
      const response = await fetch(`/api/verify?commitment=${normalizedCommitment}`);
      const data: VerifyResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setMatches(data.matches);
      setStatus(data.found ? 'found' : 'not_found');
    } catch (err) {
      console.error('Verify error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setStatus('searching');

    try {
      const hash = await hashFile(file);
      setComputedHash(hash);
      await verifyHash(hash);
    } catch (err) {
      console.error('File hash error:', err);
      setError('Failed to hash file. Please try again.');
      setStatus('error');
    }
  }, [verifyHash]);

  const handleHashSubmit = useCallback(async () => {
    await verifyHash(hashInput);
  }, [hashInput, verifyHash]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setHashInput('');
    setComputedHash(null);
    setMatches([]);
    setError(null);
  }, []);

  const searchTerm = computedHash || hashInput;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Verify a Document</h1>
        <p className="text-zinc-400">
          Check if a document was previously notarized on Hedera
        </p>
      </div>

      {/* Results */}
      {(status === 'found' || status === 'not_found') && (
        <div className="space-y-6">
          <VerifyResult
            found={status === 'found'}
            matches={matches}
            searchTerm={searchTerm}
            mode={searchParams.get('commitment') ? 'commitment' : 'hash'}
          />
          <button
            onClick={handleReset}
            className="
              w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700
              text-zinc-100 font-medium rounded-xl
              transition-colors
            "
          >
            Verify Another Document
          </button>
        </div>
      )}

      {/* Main Flow */}
      {status !== 'found' && status !== 'not_found' && (
        <div className="space-y-6">
          {/* Mode Tabs */}
          <div className="flex bg-zinc-900 rounded-xl p-1">
            <button
              onClick={() => setInputMode('file')}
              className={`
                flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                ${inputMode === 'file'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
                }
              `}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputMode('hash')}
              className={`
                flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                ${inputMode === 'hash'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
                }
              `}
            >
              Paste Hash
            </button>
          </div>

          {/* File Upload Mode */}
          {inputMode === 'file' && (
            <FileDropzone
              onFileSelect={handleFileSelect}
              disabled={status === 'searching'}
            />
          )}

          {/* Hash Input Mode */}
          {inputMode === 'hash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  SHA-256 Hash or Commitment
                </label>
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="Enter 64-character hex hash..."
                  className="
                    w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg
                    text-zinc-200 placeholder:text-zinc-600 font-mono
                    focus:outline-none focus:border-emerald-600
                  "
                />
              </div>
              <button
                onClick={handleHashSubmit}
                disabled={!hashInput || status === 'searching'}
                className="
                  w-full py-4 px-4
                  bg-gradient-to-r from-emerald-500 to-teal-500
                  hover:from-emerald-400 hover:to-teal-400
                  disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed
                  text-white font-semibold rounded-xl
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                {status === 'searching' ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Verify
                  </>
                )}
              </button>
            </div>
          )}

          {/* Searching State */}
          {status === 'searching' && inputMode === 'file' && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-zinc-400">Searching Hedera...</span>
              </div>
            </div>
          )}

          {/* Computed Hash Display */}
          {computedHash && status !== 'searching' && (
            <HashDisplay hash={computedHash} label="Computed Hash" />
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-red-400 font-medium">Error</p>
                  <p className="text-sm text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-center text-xs text-zinc-600">
            <p>
              Files are hashed locally. Only the hash is sent to verify against Hedera.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

