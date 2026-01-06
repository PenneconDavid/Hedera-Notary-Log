# Hedera Notary Log — vision.md (single source of truth)

**Last updated:** 2026-01-05  
**Project codename:** Notary Log  
**One-liner:** A tiny “proof-of-existence” app: hash a document locally, anchor that hash to Hedera Consensus Service (HCS), and later verify it was timestamped + ordered (without uploading the document).

---

## 1) Goal

Build a small, interview-friendly Hedera app that demonstrates:
- Writing to Hedera (HCS message submit)
- Reading from Hedera (Mirror Node)
- A clean, end-to-end verification UX
- Good engineering hygiene (security, error handling, tests, docs)
- Optional wallet-connected signing (structured signer identity)
- A privacy-forward mode (salted commitments + optional ZK proof)

**Core promise:** The app never needs to store the actual file—only its cryptographic hash + minimal metadata.

---

## 1.1) Current implementation status (as of 2026-01-05)

**Implemented (working end-to-end):**
- Notarize page (public hash + private commitment)
- Verify page (file upload, hash paste, commitment verify via file+salt or reveal bundle)
- Receipt links (`/verify?hash=...` and `/verify?commitment=...`)
- Mirror Node verification (paged scan with configurable search depth)
- MetaMask wallet signing (EIP-712) with server-side verification + signature validation on verify results
- Minimal metadata toggle (omit filename/MIME/note from on-chain payload)
- Local History page (`/history`) storing receipts in browser; optional stored reveal bundles (opt-in, contains salt)
- Tests (Jest) + docs + ConnectionGuide logging all endpoints/connections

**Not yet implemented:**
- Batch notarize (multi-file submit)
- HashPack wallet support
- Optional DB indexer for faster verify
- Stretch goals: auth, ZK proof bundle, user-paid submissions, analytics

---

## 2) Non-goals (to keep scope small)

- No legal/real notarization claims. This is “proof-of-existence” / audit trail tooling.
- No on-chain smart contracts required for MVP.
- No complex auth/roles in MVP (optional later).
- No heavy indexing/search requirements in MVP (optional later).

---

## 3) Personas

1) **Submitter (User)**
- Wants to “anchor” proof that a file existed at/around a time.
- Wants a receipt they can share (hash/commitment + consensus timestamp + topic/message identifiers).
- May optionally connect a wallet to sign the notarization request (adds a verifiable signer identity).

2) **Verifier (User)**
- Has a file (or a hash) and wants to verify that it was anchored.
- Wants to see consensus timestamp, ordering info, and the exact stored hash.

3) **Admin (Developer/You)**
- Configures Hedera credentials and topic details.
- Optionally rotates keys / changes topic / monitors usage.

---

## 4) User flows

### Flow A — Notarize a file (MVP + enhancements)
1. User opens **Notarize** page
2. User selects a file (PDF/image/anything)
3. App computes `SHA-256` hash **client-side**
4. User selects a notarization mode:
   - **Public hash** (default): store the SHA-256 file hash on Hedera
   - **Private commitment** (privacy-forward): store a *salted commitment* on Hedera (the raw file hash is not stored)
5. *(Optional, recommended)* User connects a wallet (HashPack or MetaMask) and signs a structured “notarization payload”
6. User clicks **“Submit to Hedera”**
7. Backend:
   - Validates payload and, if present, validates the wallet signature
   - Submits an HCS message containing the notarization record (see schema below)
8. UI shows a **Receipt**:
   - `topicId`
   - `sequenceNumber` (if available via response)
   - `consensusTimestamp` (if available immediately; otherwise “pending”)
   - `transactionId`
   - **Mode** (public hash vs private commitment)
   - **Signer** (if present): wallet type + accountId / EVM address
   - A “Verify later” link containing:
     - `hash=...` (public hash mode) OR
     - `commitment=...` (private commitment mode)
9. If **Private commitment**:
   - The browser generates and stores a `salt` locally
   - Receipt includes an option to **download a small “reveal bundle”** (salt + hashing details) for later verification

**Acceptance criteria:**
- Hash is computed without uploading the file to server
- A message with the hash/commitment is successfully submitted to HCS
- If wallet is connected, the message contains verifiable signer metadata (signature stored and re-checkable)
- User gets a shareable receipt

---
### Flow B — Verify a file (MVP + enhancements)
1. User opens **Verify** page
2. User selects a verification mode:
   - **Public hash verification**:
     - Upload a file (hash computed client-side), OR
     - Paste a hash string
   - **Private commitment verification**:
     - Upload a file (hash computed client-side)
     - Provide the `salt` (from the saved/downloaded reveal bundle), OR provide a ZK proof bundle (optional stretch)
3. App queries Mirror Node for messages for the configured topic (paged)
4. App finds matching message(s) where:
   - Public hash: `payload.content.hash == inputHash`
   - Private commitment: `payload.content.commitment == computedCommitment`
5. UI displays:
   - Match found ✅ / not found ❌
   - Consensus timestamp
   - Sequence number
   - Stored payload (sanitized view)
   - **Signature status** (if signer is present): signature valid ✅ / invalid ❌
   - Link(s) to mirror explorer view (optional)

**Acceptance criteria:**
- Given a previously notarized file, Verify finds it and displays consensus timestamp/order
- For wallet-signed submissions, Verify can validate and display the signer identity
- Given a random hash/commitment, Verify returns “not found” with clear guidance

---
### Flow C — Verify via receipt link (MVP)
1. User opens a link like `/verify?hash=...` (public hash) or `/verify?commitment=...` (private commitment)
2. Page auto-runs verification and shows results

---

## 5) Feature list

### MVP (ship this)
**Front-end**
- Notarize page:
  - File picker
  - Client-side SHA-256 hashing
  - Display hash + metadata preview
  - Submit button + submission status
  - Receipt view with copy buttons
  - History link (post-submit) *(implemented)*
- Verify page:
  - Paste hash OR upload file
  - Results view with match details
  - Pagination support (or iterative fetch until match)
  - Explorer links to Mirror Node for matches *(implemented)*
- Basic layout + empty/error states

**Back-end**
- Endpoint to submit message to HCS topic
- Basic validation + rate limiting (very light)
- Config-driven topic ID and Hedera operator credentials (env vars)
- Signature verification when wallet signing is present *(implemented for MetaMask EIP-712)*

**Hedera integration**
- Uses Hedera SDK to submit HCS messages
- Reads messages via Mirror Node REST

**Documentation**
- README with:
  - 1–2 minute “what it is”
  - Setup instructions
  - Demo steps
  - Privacy notes: file never uploaded, only hashes stored

---

### Nice-to-have (still small)
- “Minimal metadata mode” toggle (store only required fields + app version) *(implemented)*
- **Wallet-connected signing** (HashPack / MetaMask): capture signer identity + signature in message payload *(implemented for MetaMask; HashPack pending)*
- **Private commitment mode**: store a salted commitment instead of the raw file hash *(implemented; SHA-256 salted commitment for MVP)*
- “Batch notarize” multiple files (submit one message per file)
- Local history (in browser) of recent receipts *(implemented)*
- Optional DB index (Postgres/SQLite) to speed verification:
  - Store `hash -> {topicId, consensusTimestamp, seq}` after first discovery

---

### Stretch (optional, not required)
- Auth (GitHub OAuth) + per-user receipts
- Multiple topics per environment (dev/test/prod)
- **ZK proof bundle** (privacy + “deeper thinking”): generate a proof-of-knowledge for the commitment and attach it to the receipt
- User-paid submissions (wallet signs + pays for HCS submit) instead of server operator paying fees
- UI chart: submissions over time

---

## 6) System architecture

### Suggested stack (simple)
- **Frontend:** Next.js (TypeScript)
- **Backend:** Next.js API routes (server-side)
- **Hashing:** Web Crypto API in browser
- **Hedera:** Hedera JavaScript SDK (server)
- **Mirror reads:** direct REST calls from server (or client, if CORS allows)

### Components
1) **Client (browser)**
- Computes hash
- Sends “submit request” to server with payload (no file)
- Displays receipt + verification results

2) **Server (API)**
- Holds Hedera credentials (operator account + private key)
- Submits HCS message
- Optionally proxies Mirror Node reads (to avoid CORS and hide config)

3) **Mirror Node**
- Source of truth for retrieving ordered, timestamped messages

---

## 7) Data & message formats

### Hash format
- Algorithm: `SHA-256`
- Encoding: hex string (lowercase)
- Example: `2cf24dba5fb0a30e...`

### HCS message payload (JSON)
Keep it small and stable. Version the schema when you add signer/privacy fields.

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

**Private commitment mode (privacy-forward)**
- Instead of storing the raw file hash, store a salted commitment:

```json
{
  "schema": "notarylog@2",
  "content": {
    "mode": "commitment",
    "commitment": "<hex>",
    "commitmentAlg": "SHA256_SALTED | POSEIDON2_BN254",
    "hashAlg": "SHA-256"
  },
  "meta": { "...": "..." }
}
```

**Rules:**
- File content is NEVER included.
- `file.name`, `file.mime`, and `meta.note` are optional and should be omitted when `privacy.minimalMetadata = true`.
- **Signature must be verifiable:** define a deterministic signing payload (recommend EIP-712 typed data or canonicalized JSON + `payloadHash`).
- In commitment mode, `salt` is generated client-side and is **never** submitted to Hedera.

### Receipt format (what the UI shows/saves)
```json
{
  "mode": "<public_hash|commitment>",
  "hash": "<sha256_hex (public_hash only)>",
  "commitment": "<hex (commitment mode only)>",
  "topicId": "<0.0.x>",
  "transactionId": "<tx id>",
  "sequenceNumber": "<if available>",
  "consensusTimestamp": "<if available or later from mirror>",
  "mirrorLookup": {
    "topicId": "<0.0.x>",
    "queryHint": "hash=<sha256_hex>"
  }
}
```

---

## 8) API design (server)

### `POST /api/notarize`
**Request body**
```json
{
  "payload": { ...HCS message payload JSON... },
  "clientSignature": {
    "wallet": "<HashPack|MetaMask>",
    "accountId": "<optional 0.0.x>",
    "evmAddress": "<optional 0x...>",
    "scheme": "<EIP712|personal_sign|hedera_raw>",
    "payloadHash": "<hex>",
    "sig": "<0x...>"
  }
}
```

**Server responsibilities**
- Validate payload:
  - `schema` matches expected
  - `content.mode` is `public_hash` or `commitment`
  - If `public_hash`: `content.hash` is 64 hex chars
  - If `commitment`: `content.commitment` is valid hex and within size limits
  - `file.size` is a number and within max
- Enforce max payload size (e.g., 2–4 KB)
- If `clientSignature` is present:
  - Recompute `payloadHash` from the deterministic signing payload and compare
  - Verify signature recovers the claimed `evmAddress` (or otherwise matches the wallet-provided identity)
  - Copy the `signer` object into the final on-chain payload
- Submit message to the configured `TOPIC_ID`
- Return transaction info to client


---

### `GET /api/verify?hash=<sha256_hex>&maxPages=<n>` OR `GET /api/verify?commitment=<hex>&maxPages=<n>`
**Server responsibilities**
- Validate query (either `hash` or `commitment`)
- Query Mirror Node messages for the topic (paged)
- Find matching message(s)
- Return match info + consensus timestamp + seq number + stored payload
- If signer is present, verify signature and include `signatureValid: true|false`

**Response body**
```json
{
  "ok": true,
  "found": true,
  "matches": [
    {
      "topicId": "0.0.x",
      "sequenceNumber": 123,
      "consensusTimestamp": "1700000000.123456789",
      "message": { ...parsed JSON payload... }
    }
  ]
}
```

**If not found**
```json
{ "ok": true, "found": false, "matches": [] }
```

---

## 9) Mirror Node query behavior

### Strategy (simple + reliable)
- Fetch messages for topic in descending order (newest first) when verifying recent submissions.
- Page through results until:
  - A match is found, OR
  - You hit a max page limit / time budget.

### Performance note
Verification can be O(n) on topic messages. Keep topic low-volume for MVP.
Optional: add DB indexing later.

---

## 10) Error handling & UX requirements

### Notarize page errors
- File read error → show “Couldn’t read file”
- Hashing failure → show retry + instruction
- API submit failure → show error + retry
- Hedera creds missing (server) → show “Server misconfigured” (safe message)

### Verify page errors
- Invalid hash → inline validation
- Mirror node unavailable → show “Temporarily unavailable” + retry
- Topic misconfigured → admin-oriented error

### States
- Idle → Hashing → Ready to submit → Submitting → Receipt
- Verify idle → Searching → Found/Not found → Retry / refine

---

## 11) Security & privacy

- **Never upload file contents** to the server.
- Hedera operator private key exists **only on server** (env var).
- Add basic rate limiting to `/api/notarize` (per IP); consider per-signer throttles once wallet signing is enabled.
- Do not log the user’s optional “note” in plaintext server logs (or allow disabling).
- Provide UI toggles:
  - **Minimal metadata** (omit filename/MIME/note)
  - **Public hash** vs **Private commitment**
- **Private commitment mode (recommended privacy improvement):**
  - Browser generates a random `salt`
  - Computes `fileHash = SHA-256(fileBytes)` locally
  - Computes `commitment = Poseidon2(fileHash, salt)` (or another zk-friendly commitment hash)
  - Stores only `commitment` on Hedera
  - The `salt` is *never* submitted to Hedera; it is stored locally and/or exported with the receipt
- **Wallet signature (structured identity):**
  - Wallet signs a deterministic “notarization payload” (recommend EIP-712 typed data on Hedera EVM networks)
  - Server verifies signature before submitting the HCS message
  - The HCS message stores the signature + signer identity so any verifier can re-check it later

---
---

## 12) Configuration

Environment variables (server):
- `HEDERA_NETWORK` = `testnet` | `mainnet` (start with testnet)
- `HEDERA_OPERATOR_ID` = `0.0.x`
- `HEDERA_OPERATOR_KEY` = `<private key>`
- `HEDERA_TOPIC_ID` = `0.0.x`
- `MIRROR_NODE_BASE_URL` = network mirror REST base

Environment variables (client / public):
- `NEXT_PUBLIC_HEDERA_NETWORK` = `testnet` | `mainnet` (should match `HEDERA_NETWORK`)
- `NEXT_PUBLIC_MIRROR_NODE_BASE_URL` = mirror REST base used for UI explorer links (not sensitive)
- `NEXT_PUBLIC_BASE_URL` = app base URL used to construct shareable verify links

Optional:
- `MAX_MESSAGE_BYTES`
- `RATE_LIMIT_PER_MINUTE`

---

## 13) Testing plan

### Unit tests
- Hashing function:
  - same file => same hash
  - different file => different hash
- Payload validation:
  - invalid hash rejected
  - invalid commitment rejected
  - minimal metadata mode omits optional fields
  - signature verification rejects tampered payloads
- Message parsing:
  - mirror message base64 decode (if needed) → JSON parse → schema validation

### Integration tests (optional but great)
- On testnet:
  - Submit known hash
  - Poll verify until found
  - Assert consensus timestamp present

---

## 14) Definition of done (MVP)

- User can hash any file locally and submit hash to HCS topic
- User can verify by uploading file or pasting hash
- Receipts show topic + consensus timestamp/order info
- Repo includes:
  - README + setup
  - Screenshots/GIF or Loom
  - Clear privacy statement

---

## 15) Demo script (for interviews)

1) “Here’s a PDF. The app hashes it locally—no upload.”
2) “I can optionally connect a wallet and sign the notarization request.”
3) “Click Submit → it posts the hash (or a private commitment) to Hedera Consensus Service.”
4) “Now I verify the same PDF → it finds the entry on Mirror Node, validates the signature, and shows the consensus timestamp + ordering.”

---

## 16) Future enhancements (post-MVP)

- DB indexer for fast `hash -> consensusTimestamp` lookups
- Multi-topic support per user/team
- Auth + personal receipt history
- Batch submit + CSV export of receipts
