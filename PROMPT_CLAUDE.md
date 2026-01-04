# Optimized Implementation Prompt for Claude

## ROLE & CONTEXT

You are a **Senior Full-Stack Developer** with deep expertise in:
- Next.js 14+ (App Router), TypeScript, React
- Hedera Hashgraph (HCS, Mirror Node API, Hedera JavaScript SDK)
- Cryptography (SHA-256, EIP-712, wallet signatures, zero-knowledge concepts)
- Security best practices (client-side hashing, rate limiting, input validation)
- Testing (Jest, React Testing Library, integration tests)
- Vercel deployment (serverless functions, environment variables, edge functions)

## PROJECT OVERVIEW

You are implementing **Hedera Notary Log** — a proof-of-existence application that anchors document hashes to Hedera Consensus Service (HCS) without ever uploading file contents. This is an interview-friendly project demonstrating end-to-end Hedera integration.

**Core Promise:** The application NEVER stores or uploads actual file contents—only cryptographic hashes and minimal metadata.

**Deployment Target:** Vercel (Next.js App Router with API routes)

## SOURCE OF TRUTH

The complete specification is in `vision.md`. This document contains:
- Goals, non-goals, personas, user flows
- Feature lists (MVP, nice-to-have, stretch)
- System architecture, data formats, API designs
- Security requirements, testing plans, definition of done

**CRITICAL:** Reference `vision.md` for all requirements, schemas, acceptance criteria, and constraints. When in doubt, defer to the specification.

## IMPLEMENTATION PHASES

### PHASE 1: MVP Foundation (Core Functionality)
**Priority:** CRITICAL — Must complete before proceeding

**Deliverables:**
1. **Project Setup**
   - Next.js 14+ with TypeScript, App Router
   - Project structure following Next.js best practices
   - Environment variable configuration template (`.env.example`)
   - Dependencies: `@hashgraph/sdk`, `crypto-js` or Web Crypto API

2. **Client-Side Hashing**
   - File picker component (accepts any file type)
   - Client-side SHA-256 hashing using Web Crypto API
   - Hash display (hex, lowercase, 64 chars)
   - Error handling for file read failures

3. **Backend API: `/api/notarize`**
   - POST endpoint accepting payload (no file upload)
   - Payload validation per vision.md Section 8
   - Hedera SDK integration to submit HCS message
   - Returns transaction ID, topic ID, sequence number (if available)
   - Error handling with safe user-facing messages

4. **Backend API: `/api/verify`**
   - GET endpoint accepting `?hash=<sha256_hex>` query
   - Mirror Node REST API integration
   - Paginated message retrieval for configured topic
   - Match finding logic (exact hash comparison)
   - Returns match status, consensus timestamp, sequence number

5. **Frontend: Notarize Page**
   - File selection UI
   - Hash computation and display
   - Submit button with loading states
   - Receipt view showing: topicId, transactionId, consensusTimestamp, sequenceNumber
   - Copy-to-clipboard for receipt data
   - "Verify later" link generation

6. **Frontend: Verify Page**
   - Input: paste hash OR upload file (hash computed client-side)
   - Search button with loading states
   - Results display: found/not found, consensus timestamp, sequence number
   - Error states (invalid hash, mirror node unavailable)

7. **Basic Styling & Layout**
   - Clean, modern UI (Tailwind CSS recommended)
   - Responsive design
   - Empty states, error states, loading states
   - Navigation between Notarize and Verify pages

**Acceptance Criteria (from vision.md Section 14):**
- ✅ User can hash any file locally and submit hash to HCS topic
- ✅ User can verify by uploading file or pasting hash
- ✅ Receipts show topic + consensus timestamp/order info
- ✅ All file operations happen client-side (no file uploads)

**Testing Requirements:**
- Unit tests for hashing function (same file → same hash, different file → different hash)
- Unit tests for payload validation (invalid hash rejected, valid hash accepted)
- Integration test: submit known hash → verify finds it (testnet)

---

### PHASE 2: Privacy & Wallet Integration (Nice-to-Have)
**Priority:** HIGH — Enhances security and user experience

**Deliverables:**

1. **Private Commitment Mode**
   - UI toggle: "Public hash" vs "Private commitment"
   - Client-side salt generation (crypto-secure random)
   - Commitment computation: `commitment = Poseidon2(fileHash, salt)` OR simplified salted hash for MVP
   - Salt stored locally (browser storage) and exportable as "reveal bundle"
   - Receipt includes commitment (not raw hash) in private mode
   - Verify page supports commitment mode (requires salt input)

2. **Wallet-Connected Signing**
   - Wallet integration: HashPack and/or MetaMask
   - EIP-712 typed data signing for notarization payload
   - Signature verification on server before HCS submission
   - Signer metadata stored in HCS message payload (per vision.md Section 7)
   - Verify page displays signer identity and validates signature

3. **Minimal Metadata Mode**
   - UI toggle to omit optional fields (filename, MIME, note)
   - Payload validation respects `privacy.minimalMetadata` flag

4. **Enhanced Receipt**
   - Mode indicator (public_hash vs commitment)
   - Signer information (if present)
   - Downloadable reveal bundle (for commitment mode)
   - Shareable verification links (`/verify?hash=...` or `/verify?commitment=...`)

**Acceptance Criteria:**
- ✅ Private commitment mode stores only salted commitment on-chain
- ✅ Wallet signature is verifiable by any third party
- ✅ Minimal metadata mode omits optional fields when enabled

---

### PHASE 3: UX Enhancements (Nice-to-Have)
**Priority:** MEDIUM — Improves usability

**Deliverables:**

1. **Local History**
   - Browser localStorage for recent receipts
   - History view/page showing past notarizations
   - Quick re-verify from history

2. **Batch Notarization**
   - Multiple file selection
   - Sequential submission (one message per file)
   - Batch receipt view

3. **Enhanced Verify Page**
   - Auto-verify from URL params (`/verify?hash=...`)
   - Pagination controls for Mirror Node results
   - Link to Hedera Mirror Explorer (if available)

4. **Error Recovery**
   - Retry mechanisms for failed submissions
   - Better error messages with actionable guidance
   - Network failure handling

---

### PHASE 4: Stretch Goals (Optional)
**Priority:** LOW — Advanced features

**Deliverables:**

1. **Database Indexing** (Optional Performance Optimization)
   - SQLite or Postgres integration
   - Index: `hash → {topicId, consensusTimestamp, sequenceNumber}`
   - Speeds up verification for frequently queried hashes

2. **Authentication** (Optional)
   - GitHub OAuth integration
   - Per-user receipt history (server-side)

3. **ZK Proof Bundle** (Advanced Privacy)
   - Generate zero-knowledge proof for commitment
   - Attach proof to receipt for verification without revealing salt

4. **User-Paid Submissions**
   - Wallet signs AND pays for HCS submission
   - Server no longer pays fees (user covers costs)

5. **Analytics Dashboard**
   - UI chart: submissions over time
   - Basic statistics

---

## TECHNICAL SPECIFICATIONS

### Stack Requirements (from vision.md Section 6)
- **Frontend:** Next.js 14+ (App Router), TypeScript, React
- **Backend:** Next.js API routes (serverless functions on Vercel)
- **Hashing:** Web Crypto API (browser), Node.js `crypto` (server validation)
- **Hedera:** `@hashgraph/sdk` (latest version)
- **Mirror Node:** REST API calls (fetch/axios)
- **Styling:** Tailwind CSS (recommended) or CSS Modules
- **Testing:** Jest, React Testing Library, `@testing-library/jest-dom`

### Data Formats (from vision.md Section 7)

**Hash Format:**
- Algorithm: SHA-256
- Encoding: hex string (lowercase)
- Length: 64 characters
- Example: `2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824`

**HCS Message Payload Schema:**
```json
{
  "schema": "notarylog@2",
  "content": {
    "mode": "public_hash",
    "hash": "<sha256_hex>",
    "hashAlg": "SHA-256"
  },
  "file": {
    "size": <bytes>,
    "name": "<optional filename>",
    "mime": "<optional mime>"
  },
  "meta": {
    "note": "<optional user note>",
    "clientTs": "<ISO timestamp from client>",
    "app": "notarylog",
    "appVersion": "0.2.0",
    "env": "testnet",
    "nonce": "<server-provided or client-random nonce>"
  },
  "signer": {
    "wallet": "<HashPack|MetaMask>",
    "accountId": "<optional 0.0.x>",
    "evmAddress": "<optional 0x...>",
    "signature": {
      "scheme": "<EIP712|personal_sign|hedera_raw>",
      "signedAt": "<ISO timestamp>",
      "payloadHash": "<hex>",
      "sig": "<0x... signature bytes>"
    }
  },
  "privacy": {
    "minimalMetadata": false
  }
}
```

**Private Commitment Mode:**
```json
{
  "schema": "notarylog@2",
  "content": {
    "mode": "commitment",
    "commitment": "<hex>",
    "commitmentAlg": "POSEIDON2_BN254",
    "hashAlg": "SHA-256"
  }
}
```

### API Endpoints (from vision.md Section 8)

**POST /api/notarize**
- Request: `{ payload: {...}, clientSignature?: {...} }`
- Server validates payload, verifies signature (if present), submits to HCS
- Response: `{ topicId, transactionId, sequenceNumber?, consensusTimestamp? }`

**GET /api/verify?hash=<sha256_hex>` OR `?commitment=<hex>`
- Server queries Mirror Node, finds matches
- Response: `{ ok: true, found: boolean, matches: [...] }`

### Environment Variables (from vision.md Section 12)
```
HEDERA_NETWORK=testnet|mainnet
HEDERA_OPERATOR_ID=0.0.x
HEDERA_OPERATOR_KEY=<private_key>
HEDERA_TOPIC_ID=0.0.x
MIRROR_NODE_BASE_URL=<mirror_rest_base>
MAX_MESSAGE_BYTES=4096 (optional)
RATE_LIMIT_PER_MINUTE=60 (optional)
```

---

## SECURITY & PRIVACY REQUIREMENTS (from vision.md Section 11)

**CRITICAL CONSTRAINTS:**
1. **NEVER upload file contents** — all hashing must be client-side
2. **Hedera operator key** — exists ONLY on server (env var), never in client code
3. **Rate limiting** — implement on `/api/notarize` (per IP, configurable)
4. **No sensitive logging** — do not log user notes in plaintext server logs
5. **Input validation** — validate all payloads, hash formats, commitment formats
6. **Signature verification** — verify wallet signatures before accepting submissions
7. **Salt handling** — in commitment mode, salt is NEVER submitted to server/Hedera

---

## TESTING REQUIREMENTS (from vision.md Section 13)

### Unit Tests
- Hashing: same file → same hash, different file → different hash
- Payload validation: invalid hash/commitment rejected, valid accepted
- Minimal metadata mode: optional fields omitted when flag set
- Signature verification: tampered payloads rejected, valid signatures accepted
- Message parsing: Mirror Node base64 decode → JSON parse → schema validation

### Integration Tests
- Testnet workflow: submit known hash → poll verify until found → assert consensus timestamp present
- Error scenarios: invalid credentials, network failures, malformed payloads

### E2E Tests (Optional but Recommended)
- User flow: select file → hash → submit → receive receipt → verify → confirm match

---

## DEPLOYMENT CONSIDERATIONS (Vercel)

1. **Environment Variables**
   - Set all required Hedera env vars in Vercel dashboard
   - Use Vercel's environment variable encryption
   - Provide `.env.example` with placeholders (no real keys)

2. **Serverless Functions**
   - API routes must be stateless
   - Handle cold starts gracefully
   - Consider timeout limits (Vercel default: 10s for Hobby, 60s for Pro)

3. **Build Configuration**
   - Ensure Next.js builds successfully
   - TypeScript compilation with strict mode
   - No build-time secrets

4. **CORS & Security Headers**
   - Configure CORS if Mirror Node accessed from client
   - Security headers (CSP, X-Frame-Options, etc.)

---

## DOCUMENTATION REQUIREMENTS

1. **README.md** (from vision.md Section 5)
   - 1-2 minute "what it is" explanation
   - Setup instructions (env vars, dependencies, Hedera account setup)
   - Demo steps (how to notarize and verify)
   - Privacy statement: file never uploaded, only hashes stored

2. **Code Documentation**
   - JSDoc comments for public functions
   - Inline comments for complex logic (Hedera SDK usage, signature verification)
   - Architecture overview (client/server/Mirror Node flow)

3. **ConnectionGuide.txt** (per user rules)
   - Log all ports, API endpoints, and connections
   - Document Mirror Node endpoints used
   - Document Hedera network endpoints

---

## IMPLEMENTATION APPROACH

1. **Start with Phase 1 (MVP)** — get core functionality working end-to-end
2. **Test thoroughly** — ensure MVP acceptance criteria met
3. **Iterate through phases** — add enhancements incrementally
4. **Maintain code quality** — TypeScript strict mode, error handling, clean code
5. **Follow vision.md** — when uncertain, refer to specification

---

## DELIVERABLES CHECKLIST

- [ ] Complete Next.js application (all phases)
- [ ] All tests passing (unit + integration)
- [ ] README.md with setup and demo instructions
- [ ] ConnectionGuide.txt with all endpoints/ports
- [ ] `.env.example` with all required variables
- [ ] TypeScript compilation with no errors
- [ ] Vercel deployment ready (build succeeds)
- [ ] Privacy statement in README
- [ ] Code comments and documentation

---

## FINAL NOTES

- **Reference vision.md constantly** — it is the single source of truth
- **Security first** — never compromise on file privacy or key management
- **User experience** — clean UI, clear error messages, helpful guidance
- **Interview-ready** — code should demonstrate engineering best practices
- **Deployable** — application must work on Vercel without modification

Begin implementation with Phase 1 (MVP Foundation). Complete each phase fully before moving to the next. Test as you go. When ready, provide deployment instructions for Vercel.

