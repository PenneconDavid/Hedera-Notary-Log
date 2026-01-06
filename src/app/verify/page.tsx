'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FileDropzone from '@/components/FileDropzone';
import HashDisplay from '@/components/HashDisplay';
import VerifyResult from '@/components/VerifyResult';
import { computeCommitment, hashFile, isValidHashFormat } from '@/lib/crypto/hash';
import type { RevealBundle, VerifyStatus, VerifyMatch, VerifyResponse } from '@/types';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [inputMode, setInputMode] = useState<'file' | 'hash'>('file');
  const [verifyMode, setVerifyMode] = useState<'hash' | 'commitment'>('hash');
  const [hashInput, setHashInput] = useState('');
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [computedCommitment, setComputedCommitment] = useState<string | null>(null);
  const [salt, setSalt] = useState<string>('');
  const [matches, setMatches] = useState<VerifyMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedRevealBundle, setLoadedRevealBundle] = useState<RevealBundle | null>(null);
  const [maxPages, setMaxPages] = useState<number>(20);

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
      const response = await fetch(`/api/verify?hash=${normalizedHash}&maxPages=${maxPages}`);
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
  }, [maxPages]);

  const verifyCommitment = useCallback(async (commitment: string) => {
    const normalizedCommitment = commitment.toLowerCase().trim();

    setError(null);
    setStatus('searching');
    setMatches([]);

    try {
      const response = await fetch(`/api/verify?commitment=${normalizedCommitment}&maxPages=${maxPages}`);
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
  }, [maxPages]);

  // Check for URL params on mount
  useEffect(() => {
    const hashParam = searchParams.get('hash');
    const commitmentParam = searchParams.get('commitment');

    if (hashParam) {
      setVerifyMode('hash');
      setHashInput(hashParam);
      setInputMode('hash');
      // Auto-verify
      verifyHash(hashParam);
    } else if (commitmentParam) {
      setVerifyMode('commitment');
      setHashInput(commitmentParam);
      setInputMode('hash');
      // Auto-verify commitment
      verifyCommitment(commitmentParam);
    }
  }, [searchParams, verifyHash, verifyCommitment]);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setStatus('searching');

    try {
      const hash = await hashFile(file);
      setComputedHash(hash);
      if (verifyMode === 'hash') {
        await verifyHash(hash);
        return;
      }

      // commitment mode: require salt (or reveal bundle)
      const saltToUse = loadedRevealBundle?.salt || salt.trim();
      if (!saltToUse) {
        setStatus('error');
        setError('Private commitment verification requires a salt (paste it below or upload a reveal bundle).');
        return;
      }

      const commitment = await computeCommitment(hash, saltToUse);
      setComputedCommitment(commitment);
      await verifyCommitment(commitment);
    } catch (err) {
      console.error('File hash error:', err);
      setError('Failed to hash file. Please try again.');
      setStatus('error');
    }
  }, [verifyHash, verifyCommitment, verifyMode, salt, loadedRevealBundle]);

  const handleHashSubmit = useCallback(async () => {
    if (verifyMode === 'commitment') {
      await verifyCommitment(hashInput);
      return;
    }
    await verifyHash(hashInput);
  }, [hashInput, verifyHash, verifyCommitment, verifyMode]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setHashInput('');
    setComputedHash(null);
    setComputedCommitment(null);
    setSalt('');
    setLoadedRevealBundle(null);
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
            mode={verifyMode === 'commitment' ? 'commitment' : 'hash'}
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
          {/* Search depth */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Search depth
                </label>
                <p className="text-xs text-zinc-500">
                  Controls how many pages of Mirror Node messages to scan (newest-first). Higher values can be slower.
                </p>
              </div>
              <select
                value={maxPages}
                onChange={(e) => setMaxPages(Number.parseInt(e.target.value, 10))}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200"
                disabled={status === 'searching'}
              >
                <option value={5}>Fast (5 pages)</option>
                <option value={10}>Normal (10 pages)</option>
                <option value={20}>Deep (20 pages)</option>
                <option value={50}>Very deep (50 pages)</option>
              </select>
            </div>
          </div>

          {/* Verification Mode */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Verification Mode
            </label>
            <div className="flex bg-zinc-900 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setVerifyMode('hash');
                  setLoadedRevealBundle(null);
                  setSalt('');
                  setComputedCommitment(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                  ${verifyMode === 'hash'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }
                `}
              >
                Public Hash
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyMode('commitment');
                  setComputedCommitment(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                  ${verifyMode === 'commitment'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }
                `}
              >
                Private Commitment
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {verifyMode === 'commitment'
                ? 'Upload the original file + provide the salt (or upload the reveal bundle) to recompute the commitment.'
                : 'Upload the original file or paste its SHA-256 hash.'}
            </p>
          </div>

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
            <div className="space-y-4">
              <FileDropzone
                onFileSelect={handleFileSelect}
                disabled={status === 'searching'}
              />

              {/* Commitment helpers */}
              {verifyMode === 'commitment' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-200 font-medium">Salt / Reveal bundle</p>
                      <p className="text-xs text-zinc-500">
                        The salt is never sent to the server. It’s used locally to recompute the commitment.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-200 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                      </svg>
                      Upload reveal bundle
                      <input
                        type="file"
                        className="hidden"
                        accept="application/json,.json"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const text = await f.text();
                            const bundle = JSON.parse(text) as RevealBundle;
                            if (
                              bundle?.version !== '1.0' ||
                              typeof bundle.salt !== 'string' ||
                              typeof bundle.hash !== 'string' ||
                              typeof bundle.commitment !== 'string'
                            ) {
                              throw new Error('Invalid reveal bundle format');
                            }
                            setLoadedRevealBundle(bundle);
                            setSalt(bundle.salt);
                            setComputedHash(bundle.hash);
                            setComputedCommitment(bundle.commitment);
                            setError(null);
                          } catch (err) {
                            console.error(err);
                            setLoadedRevealBundle(null);
                            setError('Could not read reveal bundle. Make sure it is a valid Notary Log JSON bundle.');
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      Salt
                    </label>
                    <input
                      type="text"
                      value={salt}
                      onChange={(e) => {
                        setSalt(e.target.value);
                        setLoadedRevealBundle(null);
                      }}
                      placeholder="Paste salt (hex)..."
                      className="
                        w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg
                        text-zinc-200 placeholder:text-zinc-600 font-mono
                        focus:outline-none focus:border-emerald-600
                      "
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hash Input Mode */}
          {inputMode === 'hash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  {verifyMode === 'commitment' ? 'Commitment (hex)' : 'SHA-256 Hash'}
                </label>
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder={verifyMode === 'commitment' ? 'Paste commitment hex...' : 'Enter 64-character hex hash...'}
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

          {/* Computed Commitment Display */}
          {computedCommitment && status !== 'searching' && (
            <HashDisplay hash={computedCommitment} label="Computed Commitment" />
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
              Files are hashed locally. Only the hash/commitment is sent to verify against Hedera.
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

