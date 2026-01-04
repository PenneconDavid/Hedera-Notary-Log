/**
 * Cryptographic Hashing Utilities
 * 
 * Client-side SHA-256 hashing using Web Crypto API.
 * Files are NEVER uploaded - all hashing happens in the browser.
 */

/**
 * Compute SHA-256 hash of a file
 * 
 * @param file - The file to hash
 * @returns Promise resolving to hex-encoded hash (64 chars, lowercase)
 */
export async function hashFile(file: File): Promise<string> {
  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  
  // Compute SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Compute SHA-256 hash of a string
 * 
 * @param text - The string to hash
 * @returns Promise resolving to hex-encoded hash (64 chars, lowercase)
 */
export async function hashString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Compute SHA-256 hash of an ArrayBuffer
 * 
 * @param buffer - The buffer to hash
 * @returns Promise resolving to hex-encoded hash (64 chars, lowercase)
 */
export async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Generate a cryptographically secure random salt
 * 
 * @param length - Length in bytes (default: 32)
 * @returns Hex-encoded random salt
 */
export function generateSalt(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute a salted commitment (simplified version using SHA-256)
 * 
 * commitment = SHA-256(hash || salt)
 * 
 * Note: For production, consider using a ZK-friendly hash like Poseidon2
 * 
 * @param hash - The original file hash
 * @param salt - Random salt
 * @returns Promise resolving to hex-encoded commitment
 */
export async function computeCommitment(hash: string, salt: string): Promise<string> {
  // Concatenate hash and salt
  const combined = hash + salt;
  
  // Hash the combination
  return hashString(combined);
}

/**
 * Verify that a commitment matches a hash and salt
 * 
 * @param commitment - The stored commitment
 * @param hash - The claimed file hash
 * @param salt - The claimed salt
 * @returns Promise resolving to true if commitment is valid
 */
export async function verifyCommitment(
  commitment: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const computed = await computeCommitment(hash, salt);
  return computed === commitment;
}

/**
 * Generate a random nonce for message uniqueness
 * 
 * @returns Hex-encoded random nonce (16 bytes = 32 chars)
 */
export function generateNonce(): string {
  return generateSalt(16);
}

/**
 * Validate hash format (SHA-256 hex)
 * 
 * @param hash - The hash to validate
 * @returns true if valid SHA-256 hex format
 */
export function isValidHashFormat(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

/**
 * Format file size for display
 * 
 * @param bytes - Size in bytes
 * @returns Human-readable size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

