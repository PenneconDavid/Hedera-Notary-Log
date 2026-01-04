// jest.setup.js
import '@testing-library/jest-dom';

// Mock the Web Crypto API for Node.js environment
const { webcrypto } = require('crypto');

// Polyfill crypto.subtle for Jest
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
} else if (typeof globalThis.crypto.subtle === 'undefined') {
  globalThis.crypto.subtle = webcrypto.subtle;
}

// Also set on global.crypto for compatibility
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

// Mock TextEncoder/TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
