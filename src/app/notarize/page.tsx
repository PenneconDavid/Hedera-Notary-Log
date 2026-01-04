'use client';

import { useState, useCallback } from 'react';
import FileDropzone from '@/components/FileDropzone';
import HashDisplay from '@/components/HashDisplay';
import Receipt from '@/components/Receipt';
import { hashFile, computeCommitment, generateNonce, generateSalt, formatFileSize } from '@/lib/crypto/hash';
import type { 
  NotarizeStatus, 
  FileInfo, 
  NotarizationReceipt, 
  HCSMessagePayload,
  NotarizeResponse,
  NotarizationMode,
  RevealBundle,
} from '@/types';

const APP_VERSION = '0.2.0';

export default function NotarizePage() {
  const [status, setStatus] = useState<NotarizeStatus>('idle');
  const [file, setFile] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<NotarizationReceipt | null>(null);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<NotarizationMode>('public_hash');
  const [salt, setSalt] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    setReceipt(null);
    setStatus('hashing');
    setSalt(null);
    setCommitment(null);

    try {
      // Compute hash
      const hash = await hashFile(selectedFile);

      // If we're in commitment mode, generate salt + commitment client-side.
      if (mode === 'commitment') {
        const newSalt = generateSalt(32);
        const newCommitment = await computeCommitment(hash, newSalt);
        setSalt(newSalt);
        setCommitment(newCommitment);
      }

      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'application/octet-stream',
        hash,
      });
      setStatus('ready');
    } catch (err) {
      console.error('Hashing error:', err);
      setError('Failed to hash file. Please try again.');
      setStatus('error');
    }
  }, [mode]);

  const handleSubmit = useCallback(async () => {
    if (!file?.hash) return;
    if (mode === 'commitment' && (!salt || !commitment)) {
      setError('Missing salt/commitment. Please re-select the file and try again.');
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('submitting');

    try {
      // Build payload
      const payload: HCSMessagePayload = {
        schema: 'notarylog@2',
        content:
          mode === 'commitment'
            ? {
                mode: 'commitment',
                commitment: commitment!,
                commitmentAlg: 'SHA256_SALTED',
                hashAlg: 'SHA-256',
              }
            : {
                mode: 'public_hash',
                hash: file.hash,
                hashAlg: 'SHA-256',
              },
        file: {
          size: file.size,
          name: file.name,
          mime: file.type,
        },
        meta: {
          clientTs: new Date().toISOString(),
          app: 'notarylog',
          appVersion: APP_VERSION,
          env: (process.env.NEXT_PUBLIC_HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
          nonce: generateNonce(),
          ...(note && { note }),
        },
        privacy: {
          minimalMetadata: false,
        },
      };

      // Submit to API
      const response = await fetch('/api/notarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      const data: NotarizeResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      // Create receipt
      const newReceipt: NotarizationReceipt = {
        mode,
        ...(mode === 'commitment' ? { commitment: commitment! } : { hash: file.hash }),
        topicId: data.topicId,
        transactionId: data.transactionId,
        sequenceNumber: data.sequenceNumber,
        consensusTimestamp: data.consensusTimestamp,
        mirrorLookup: {
          topicId: data.topicId,
          queryHint: mode === 'commitment' ? `commitment=${commitment!}` : `hash=${file.hash}`,
        },
        createdAt: new Date().toISOString(),
      };

      // If commitment mode, store the reveal bundle locally (salt is NEVER sent to server/Hedera).
      let revealBundle: RevealBundle | undefined;
      if (mode === 'commitment') {
        revealBundle = {
          version: '1.0',
          hash: file.hash,
          salt: salt!,
          commitment: commitment!,
          commitmentAlg: 'SHA256_SALTED',
          createdAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem('notarylog:lastRevealBundle', JSON.stringify(revealBundle));
        } catch {
          // ignore storage failures (private browsing, etc.)
        }
      }

      setReceipt(newReceipt);
      setStatus('success');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      setStatus('error');
    }
  }, [file, note, mode, salt, commitment]);

  const handleReset = useCallback(() => {
    setFile(null);
    setReceipt(null);
    setError(null);
    setNote('');
    setSalt(null);
    setCommitment(null);
    setStatus('idle');
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Notarize a Document</h1>
        <p className="text-zinc-400">
          Create a timestamped proof-of-existence for any file
        </p>
      </div>

      {/* Success State */}
      {status === 'success' && receipt && (
        <div className="space-y-6">
          <Receipt receipt={receipt} baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ''} />
          <button
            onClick={handleReset}
            className="
              w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700
              text-zinc-100 font-medium rounded-xl
              transition-colors
            "
          >
            Notarize Another Document
          </button>
        </div>
      )}

      {/* Main Flow */}
      {status !== 'success' && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Notarization Mode
            </label>
            <div className="flex bg-zinc-900 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('public_hash');
                  setSalt(null);
                  setCommitment(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                  ${mode === 'public_hash'
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
                  setMode('commitment');
                  // If a file hash already exists, derive a new salt/commitment immediately.
                  if (file?.hash) {
                    (async () => {
                      const newSalt = generateSalt(32);
                      const newCommitment = await computeCommitment(file.hash!, newSalt);
                      setSalt(newSalt);
                      setCommitment(newCommitment);
                    })();
                  }
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                  ${mode === 'commitment'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }
                `}
              >
                Private Commitment
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {mode === 'commitment'
                ? 'Stores a salted commitment on Hedera (the raw file hash is NOT stored). Save your reveal bundle to verify later.'
                : 'Stores the raw SHA-256 file hash on Hedera.'}
            </p>
          </div>

          {/* File Upload */}
          {!file && (
            <FileDropzone
              onFileSelect={handleFileSelect}
              disabled={status === 'hashing'}
            />
          )}

          {/* Hashing State */}
          {status === 'hashing' && (
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
                <span className="text-zinc-400">Computing hash...</span>
              </div>
            </div>
          )}

          {/* File Info & Hash Display */}
          {file && status !== 'hashing' && (
            <>
              {/* File Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200 truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatFileSize(file.size)}
                        {file.type && ` • ${file.type}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Remove file"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Hash Display */}
              {mode === 'commitment' ? (
                <>
                  {commitment && <HashDisplay hash={commitment} label="Commitment (stored on Hedera)" />}
                  {file.hash && (
                    <div className="opacity-90">
                      <HashDisplay hash={file.hash} label="File Hash (local only)" truncate />
                    </div>
                  )}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-300 font-medium mb-1">Reveal bundle</p>
                    <p className="text-xs text-zinc-500 mb-3">
                      Download and store this safely. It contains the salt needed to verify the commitment later.
                      The salt is never sent to the server.
                    </p>
                    <button
                      type="button"
                      disabled={!salt || !commitment || !file.hash}
                      onClick={() => {
                        const bundle: RevealBundle = {
                          version: '1.0',
                          hash: file.hash!,
                          salt: salt!,
                          commitment: commitment!,
                          commitmentAlg: 'SHA256_SALTED',
                          createdAt: new Date().toISOString(),
                        };
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
                      className="
                        inline-flex items-center gap-2 px-4 py-2
                        bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed
                        text-zinc-100 text-sm font-medium rounded-lg transition-colors
                      "
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
                        />
                      </svg>
                      Download reveal bundle
                    </button>
                  </div>
                </>
              ) : (
                file.hash && <HashDisplay hash={file.hash} />
              )}

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note about this document..."
                  className="
                    w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg
                    text-zinc-200 placeholder:text-zinc-600
                    focus:outline-none focus:border-emerald-600
                    resize-none
                  "
                  rows={2}
                  maxLength={200}
                />
                <p className="text-xs text-zinc-600 mt-1">{note.length}/200 characters</p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={status === 'submitting'}
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
                {status === 'submitting' ? (
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
                    Submitting to Hedera...
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Submit to Hedera
                  </>
                )}
              </button>
            </>
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

          {/* Privacy Notice */}
          <div className="text-center text-xs text-zinc-600">
            <p className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Your file is hashed locally and never uploaded
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

