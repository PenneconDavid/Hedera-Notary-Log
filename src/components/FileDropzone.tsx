'use client';

import { useCallback, useState } from 'react';
import { formatFileSize } from '@/lib/crypto/hash';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
}

export default function FileDropzone({
  onFileSelect,
  disabled = false,
  accept,
  maxSize = 1024 * 1024 * 100, // 100MB default
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (maxSize && file.size > maxSize) {
        setError(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
        return;
      }

      onFileSelect(file);
    },
    [maxSize, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <label
        className={`
          flex flex-col items-center justify-center w-full h-48
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-emerald-400 bg-emerald-950/30'
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className={`w-10 h-10 mb-3 ${isDragging ? 'text-emerald-400' : 'text-zinc-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-300">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-zinc-500">
            Any file type • Max {formatFileSize(maxSize)}
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
          accept={accept}
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

