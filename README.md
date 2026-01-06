# Hedera Notary Log

**Proof-of-existence on Hedera — without uploading your files.**

Anchor document hashes to Hedera Consensus Service (HCS). Prove a document existed at a specific time. Verify anytime. Your files never leave your device.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hedera](https://img.shields.io/badge/Hedera-Testnet-blueviolet)
![Next.js](https://img.shields.io/badge/Next.js-16+-black)

---

## What is this?

Notary Log is a lightweight proof-of-existence application that:

1. **Hashes documents locally** — using SHA-256 in your browser (files never uploaded)
2. **Anchors the hash to Hedera** — immutable, timestamped, and ordered via HCS
3. **Verifies documents** — upload the same file later to confirm it was notarized

Perfect for:
- Timestamping intellectual property
- Audit trails for contracts and agreements
- Proving document integrity
- Interview-quality demonstration of Hedera integration

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Hedera testnet account ([get one free](https://portal.hedera.com/))

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/hedera-notary-log.git
   cd hedera-notary-log
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Hedera credentials:
   ```env
   HEDERA_NETWORK=testnet
   HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
   HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
   HEDERA_TOPIC_ID=0.0.YOUR_TOPIC_ID
   MIRROR_NODE_BASE_URL=https://testnet.mirrornode.hedera.com
   NEXT_PUBLIC_HEDERA_NETWORK=testnet
   NEXT_PUBLIC_MIRROR_NODE_BASE_URL=https://testnet.mirrornode.hedera.com
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

   > **Need a topic ID?** See [HEDERA_SETUP.md](./HEDERA_SETUP.md) for step-by-step instructions.

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

---

## Demo

### Notarize a Document

1. Go to the **Notarize** page
2. Select or drag-and-drop any file
3. See the SHA-256 hash computed locally
4. (Optional) Enable **Private Commitment** mode and/or **Sign with MetaMask**
5. Click **Submit to Hedera**
5. Receive a receipt with transaction ID, topic ID, and consensus timestamp

### Verify a Document

1. Go to the **Verify** page
2. Choose **Public Hash** or **Private Commitment** verification
3. Upload the same file (or paste the hash/commitment)
4. For **Private Commitment**, provide the salt (or upload the reveal bundle) to recompute the commitment locally
5. See the match with consensus timestamp, sequence number, and signature status (if signed)

### View local history

- Visit **/history** to see receipts stored in this browser
- You can clear history anytime

---

## Features

### MVP (Complete)
- ✅ Client-side SHA-256 hashing (files never uploaded)
- ✅ HCS message submission via Hedera SDK
- ✅ Mirror Node verification
- ✅ Receipt generation with verification links
- ✅ Modern, responsive UI
- ✅ Rate limiting

### Enhancements (Implemented)
- ✅ Private commitment mode (salted commitments; salt never sent to server/Hedera)
- ✅ Wallet-connected signing (**MetaMask + EIP-712**) with server-side verification
- ✅ Minimal metadata mode (omit filename/MIME/note from on-chain payload)
- ✅ Local receipt history (`/history`) + optional stored reveal bundles (opt-in)

### Enhancements (Planned / Not yet implemented)
- ⏳ Batch notarization (multi-file submit)
- ⏳ HashPack wallet support (MetaMask only today)
- ⏳ DB indexer for faster verify (optional)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── notarize/route.ts    # HCS submission endpoint
│   │   └── verify/route.ts      # Mirror Node query endpoint
│   ├── history/page.tsx         # Local receipt history UI
│   ├── notarize/page.tsx        # Notarize UI
│   ├── verify/page.tsx          # Verify UI
│   └── page.tsx                 # Home page
├── components/                   # React components
├── lib/
│   ├── crypto/hash.ts           # Hashing utilities
│   └── hedera/                  # Hedera SDK integration
│   └── wallet/                  # MetaMask EIP-712 signing + server verify
│   └── storage/                 # Local receipt + reveal bundle storage helpers (browser)
└── types/index.ts               # TypeScript definitions
```

---

## Privacy & Security

### Your Files Stay Private

- **Client-side hashing**: Files are hashed in your browser using the Web Crypto API
- **No file uploads**: Only the 64-character hash is sent to the server
- **No server storage**: We don't store your files, hashes, receipts, or any user data server-side
- **Private commitment mode**: Store a salted commitment on Hedera (salt never leaves your device)
- **Local history**: Stored only in your browser (`localStorage`); you can clear it anytime

### Security Measures

- Hedera credentials stored server-side only (never in client code)
- Rate limiting on submission endpoint
- Input validation on all API endpoints
- TypeScript strict mode throughout
- Optional MetaMask EIP-712 signing with server-side verification

---

## API Endpoints

### `POST /api/notarize`

Submit a document hash to HCS.

**Request:**
```json
{
  "payload": {
    "schema": "notarylog@2",
    "content": {
      "mode": "public_hash",
      "hash": "<64-char hex>",
      "hashAlg": "SHA-256"
    },
    "file": { "size": 1024, "name": "doc.pdf" },
    "meta": { "app": "notarylog", "appVersion": "0.2.0", ... }
  },
  "clientSignature": {
    "wallet": "MetaMask",
    "evmAddress": "0x...",
    "scheme": "EIP712",
    "payloadHash": "<sha256_hex>",
    "sig": "0x..."
  }
}
```

**Response:**
```json
{
  "ok": true,
  "topicId": "0.0.123456",
  "transactionId": "0.0.123456@1234567890.123456789",
  "sequenceNumber": 42
}
```

### `GET /api/verify?hash=<sha256hex>&maxPages=<n>` (or `?commitment=<hex>&maxPages=<n>`)

Verify a hash exists on HCS.

**Response:**
```json
{
  "ok": true,
  "found": true,
  "matches": [
    {
      "topicId": "0.0.123456",
      "sequenceNumber": 42,
      "consensusTimestamp": "1234567890.123456789",
      "message": { ... },
      "signatureValid": true
    }
  ]
}
```

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables in Vercel settings
4. Deploy!

### Environment Variables for Production

Set these in your Vercel dashboard:
- `HEDERA_NETWORK`: `mainnet` or `testnet`
- `HEDERA_OPERATOR_ID`: Your operator account
- `HEDERA_OPERATOR_KEY`: Your private key (encrypted by Vercel)
- `HEDERA_TOPIC_ID`: Your HCS topic
- `MIRROR_NODE_BASE_URL`: Mirror Node URL
- `NEXT_PUBLIC_BASE_URL`: Your production URL

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Hedera**: @hashgraph/sdk
- **Testing**: Jest + React Testing Library

---

## Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [HCS Overview](https://docs.hedera.com/hedera/core-concepts/hashgraph-consensus-mechanism/hashgraph-consensus-service-hcs)
- [Mirror Node REST API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api)
- [Hedera Portal](https://portal.hedera.com/)

---

## License

MIT License — see [LICENSE](./LICENSE)

---

## Acknowledgments

Built on [Hedera Hashgraph](https://hedera.com) — the enterprise-grade public network.
