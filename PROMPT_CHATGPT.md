# Optimized Implementation Prompt for ChatGPT

## ROLE ASSIGNMENT

You are a **Senior Full-Stack Developer** specializing in:
- Next.js 14+ (App Router), TypeScript, React
- Hedera Hashgraph (HCS, Mirror Node, JavaScript SDK)
- Cryptography and security (SHA-256, wallet signatures, client-side hashing)
- Testing frameworks (Jest, React Testing Library)
- Vercel deployment

## PROJECT MISSION

Build **Hedera Notary Log** — a complete proof-of-existence application that anchors document hashes to Hedera Consensus Service without uploading file contents. This is a production-ready, interview-quality project.

**Core Principle:** Files are NEVER uploaded. Only cryptographic hashes are stored on-chain.

**Target Deployment:** Vercel (Next.js serverless functions)

## SPECIFICATION REFERENCE

The complete requirements are documented in `vision.md`. This file contains:
- ✅ Goals, personas, user flows (Sections 1-4)
- ✅ Feature lists: MVP, nice-to-have, stretch (Section 5)
- ✅ Architecture, data formats, API designs (Sections 6-8)
- ✅ Security, testing, deployment requirements (Sections 11-14)

**IMPORTANT:** Always refer to `vision.md` for exact schemas, acceptance criteria, and constraints.

---

## IMPLEMENTATION ROADMAP

### 🎯 STEP 1: Project Foundation
**Goal:** Set up Next.js project with TypeScript and Hedera dependencies

**Tasks:**
1. Initialize Next.js 14+ with App Router and TypeScript
2. Install dependencies: `@hashgraph/sdk`, `crypto-js` (or use Web Crypto API)
3. Set up Tailwind CSS (or preferred styling solution)
4. Create `.env.example` with all required variables:
   ```
   HEDERA_NETWORK=testnet
   HEDERA_OPERATOR_ID=0.0.x
   HEDERA_OPERATOR_KEY=<private_key>
   HEDERA_TOPIC_ID=0.0.x
   MIRROR_NODE_BASE_URL=https://testnet.mirrornode.hedera.com
   ```
5. Create project structure:
   ```
   /app
     /api
       /notarize
       /verify
     /notarize
     /verify
   /lib
     /hedera
     /crypto
   /components
   /types
   ```

**Acceptance:** Project builds, TypeScript compiles, dependencies installed

---

### 🎯 STEP 2: Client-Side Hashing (MVP Core)
**Goal:** Implement file hashing in the browser

**Tasks:**
1. Create file picker component (`/app/notarize/page.tsx`)
2. Implement SHA-256 hashing using Web Crypto API:
   ```typescript
   async function hashFile(file: File): Promise<string> {
     const buffer = await file.arrayBuffer();
     const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
   }
   ```
3. Display hash (64-char hex, lowercase)
4. Handle errors: file read failures, unsupported files

**Acceptance:** User can select file → hash computed → displayed correctly

---

### 🎯 STEP 3: Backend API — Notarize Endpoint
**Goal:** Submit hash to Hedera Consensus Service

**Tasks:**
1. Create `/app/api/notarize/route.ts` (POST handler)
2. Implement payload validation (per vision.md Section 8):
   - Schema version check
   - Hash format validation (64 hex chars)
   - File size limits
   - Max payload size (2-4 KB)
3. Initialize Hedera SDK:
   ```typescript
   import { Client, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
   
   const client = Client.forTestnet();
   client.setOperator(operatorId, operatorKey);
   ```
4. Submit HCS message:
   ```typescript
   const message = JSON.stringify(payload);
   const transaction = await new TopicMessageSubmitTransaction()
     .setTopicId(topicId)
     .setMessage(message)
     .execute(client);
   ```
5. Return response: `{ topicId, transactionId, sequenceNumber?, consensusTimestamp? }`
6. Error handling: network failures, invalid credentials, validation errors

**Acceptance:** Valid payload → HCS submission succeeds → returns transaction info

---

### 🎯 STEP 4: Backend API — Verify Endpoint
**Goal:** Query Mirror Node to find hash matches

**Tasks:**
1. Create `/app/api/verify/route.ts` (GET handler)
2. Extract query param: `?hash=<sha256_hex>` or `?commitment=<hex>`
3. Query Mirror Node REST API:
   ```typescript
   const response = await fetch(
     `${mirrorBaseUrl}/api/v1/topics/${topicId}/messages?limit=100&order=desc`
   );
   const data = await response.json();
   ```
4. Parse messages (base64 decode if needed) → JSON parse
5. Find matches: `payload.content.hash === inputHash`
6. Return: `{ ok: true, found: boolean, matches: [...] }`
7. Implement pagination (fetch until match found or max pages reached)

**Acceptance:** Given known hash → finds match → returns consensus timestamp

---

### 🎯 STEP 5: Frontend — Notarize Page
**Goal:** Complete notarization user flow

**Tasks:**
1. Build `/app/notarize/page.tsx`:
   - File picker UI
   - Hash display (with copy button)
   - Submit button
   - Loading states (hashing, submitting)
   - Receipt view (after submission)
2. Receipt shows:
   - Topic ID
   - Transaction ID
   - Sequence number (if available)
   - Consensus timestamp (if available)
   - "Verify later" link (`/verify?hash=...`)
3. Error states: file read error, API failure, network error
4. Copy-to-clipboard for receipt data

**Acceptance:** User can notarize file → see receipt → copy/share receipt

---

### 🎯 STEP 6: Frontend — Verify Page
**Goal:** Complete verification user flow

**Tasks:**
1. Build `/app/verify/page.tsx`:
   - Input: paste hash OR upload file (hash computed client-side)
   - Search button
   - Loading state (searching...)
   - Results display:
     - ✅ Found: consensus timestamp, sequence number, stored payload
     - ❌ Not found: clear message
2. Support URL params: `/verify?hash=...` (auto-verify on load)
3. Error states: invalid hash format, mirror node unavailable

**Acceptance:** User can verify hash → see match status → view consensus timestamp

---

### 🎯 STEP 7: Styling & Polish
**Goal:** Professional, modern UI

**Tasks:**
1. Apply Tailwind CSS (or preferred styling)
2. Responsive design (mobile-friendly)
3. Loading spinners, empty states, error states
4. Navigation between pages
5. Consistent color scheme and typography

**Acceptance:** UI is clean, professional, and responsive

---

### 🎯 STEP 8: Testing (MVP)
**Goal:** Ensure core functionality works

**Tasks:**
1. Unit tests:
   - `hashFile()`: same file → same hash, different file → different hash
   - Payload validation: invalid hash rejected, valid accepted
2. Integration test (testnet):
   - Submit known hash → verify finds it → assert consensus timestamp present
3. Run tests: `npm test`

**Acceptance:** All tests pass

---

### 🎯 STEP 9: Documentation
**Goal:** Clear setup and usage instructions

**Tasks:**
1. Update `README.md`:
   - What it is (1-2 minute explanation)
   - Setup instructions (env vars, Hedera account setup)
   - Demo steps (how to notarize and verify)
   - Privacy statement: files never uploaded
2. Create `ConnectionGuide.txt`:
   - Log all API endpoints (`/api/notarize`, `/api/verify`)
   - Document Mirror Node endpoints used
   - Document Hedera network endpoints
3. Code comments: JSDoc for public functions, inline comments for complex logic

**Acceptance:** README is clear, ConnectionGuide.txt is complete

---

### 🎯 STEP 10: Private Commitment Mode (Enhancement)
**Goal:** Add privacy-forward option

**Tasks:**
1. UI toggle: "Public hash" vs "Private commitment"
2. Client-side salt generation (crypto-secure)
3. Commitment computation (simplified: `SHA-256(fileHash + salt)` for MVP, or Poseidon2 if library available)
4. Salt stored in browser localStorage
5. Receipt includes commitment (not raw hash)
6. Verify page supports commitment mode (requires salt input)
7. Export "reveal bundle" (salt + hashing details)

**Acceptance:** User can notarize in private mode → verify with salt → match found

---

### 🎯 STEP 11: Wallet Integration (Enhancement)
**Goal:** Add wallet-connected signing

**Tasks:**
1. Integrate HashPack and/or MetaMask
2. EIP-712 typed data signing:
   ```typescript
   const domain = { name: 'NotaryLog', version: '1' };
   const types = { Notarization: [{ name: 'hash', type: 'bytes32' }] };
   const signature = await wallet.request({ method: 'eth_signTypedData_v4', params: [...] });
   ```
3. Server-side signature verification (before HCS submission)
4. Store signer metadata in HCS payload (per vision.md Section 7)
5. Verify page displays signer identity and validates signature

**Acceptance:** Wallet-signed submission → signature verified → verifier can validate

---

### 🎯 STEP 12: Additional Enhancements
**Goal:** Nice-to-have features

**Tasks:**
1. **Minimal Metadata Mode:** Toggle to omit optional fields
2. **Local History:** Browser localStorage for recent receipts
3. **Batch Notarization:** Multiple file selection, sequential submission
4. **Enhanced Verify:** Pagination, Mirror Explorer links

**Acceptance:** Each enhancement works independently

---

### 🎯 STEP 13: Stretch Goals (Optional)
**Goal:** Advanced features

**Tasks:**
1. **Database Indexing:** SQLite/Postgres for faster verification
2. **Authentication:** GitHub OAuth, per-user receipts
3. **ZK Proof Bundle:** Zero-knowledge proof generation
4. **User-Paid Submissions:** Wallet pays for HCS fees
5. **Analytics:** Submissions over time chart

**Acceptance:** Stretch goals work as specified

---

### 🎯 STEP 14: Vercel Deployment Prep
**Goal:** Ensure deployment readiness

**Tasks:**
1. Verify build succeeds: `npm run build`
2. Test TypeScript compilation: `tsc --noEmit`
3. Ensure all env vars documented in `.env.example`
4. Check serverless function timeouts (Vercel: 10s Hobby, 60s Pro)
5. Test CORS if Mirror Node accessed from client
6. Add security headers if needed

**Acceptance:** Project builds successfully, ready for Vercel deployment

---

## TECHNICAL CONSTRAINTS

### Security Requirements (from vision.md Section 11)
1. **NEVER upload file contents** — all hashing client-side
2. **Hedera operator key** — server-only (env var), never in client
3. **Rate limiting** — `/api/notarize` (per IP, configurable)
4. **No sensitive logging** — don't log user notes in plaintext
5. **Input validation** — validate all payloads, hash formats
6. **Signature verification** — verify wallet signatures server-side
7. **Salt privacy** — in commitment mode, salt NEVER sent to server

### Data Formats (from vision.md Section 7)

**Hash:** SHA-256, hex lowercase, 64 chars
**HCS Payload:** See vision.md Section 7 for exact JSON schema
**API Endpoints:** See vision.md Section 8 for request/response formats

---

## TESTING CHECKLIST

- [ ] Unit: Hashing function (deterministic, collision-resistant)
- [ ] Unit: Payload validation (invalid rejected, valid accepted)
- [ ] Unit: Minimal metadata mode (optional fields omitted)
- [ ] Unit: Signature verification (tampered rejected, valid accepted)
- [ ] Integration: Submit → Verify workflow (testnet)
- [ ] E2E: Complete user flow (optional but recommended)

---

## DELIVERABLES CHECKLIST

- [ ] Complete Next.js application (all steps)
- [ ] All tests passing
- [ ] README.md (setup + demo)
- [ ] ConnectionGuide.txt (all endpoints)
- [ ] `.env.example` (all variables)
- [ ] TypeScript compilation (no errors)
- [ ] Vercel deployment ready
- [ ] Privacy statement in README
- [ ] Code documentation

---

## IMPLEMENTATION STRATEGY

1. **Work sequentially** — complete each step before moving to next
2. **Test incrementally** — verify each step works
3. **Reference vision.md** — it's the source of truth
4. **Security first** — never compromise on file privacy
5. **Code quality** — TypeScript strict mode, error handling, clean code

---

## FINAL INSTRUCTIONS

Begin with **STEP 1: Project Foundation**. Complete each step fully, test it, then proceed. When all steps are complete, provide:
1. Summary of what was built
2. Deployment instructions for Vercel
3. Any remaining TODOs or known limitations

**Remember:** The goal is a production-ready, interview-quality application that demonstrates full-stack Hedera integration with strong security and privacy practices.

