import Link from 'next/link';

export default function WhitepaperPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-4">
          White paper (plain English)
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Notary Log — Proof-of-Existence on Hedera</h1>
        <p className="text-zinc-400 text-lg max-w-3xl">
          Notary Log helps you create a tamper-evident receipt that a file existed at (or before) a particular time,
          without uploading the file. It anchors a hash (or a privacy-preserving commitment) to Hedera Consensus Service.
        </p>
      </header>

      {/* Table of contents */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">Contents</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <a className="text-emerald-400 hover:text-emerald-300" href="#quickstart">1. Quick start</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#what-it-is">2. What this is</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#what-it-proves">3. What it proves / doesn’t</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#privacy-modes">4. Privacy modes</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#how-to-use">5. How to use</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#how-it-works">6. How it works (technical)</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#threat-model">7. Threat model</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#build-guide">8. How to build / run it</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#faq">9. FAQ</a>
          <a className="text-emerald-400 hover:text-emerald-300" href="#glossary">10. Glossary</a>
        </div>
      </section>

      <section id="quickstart" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">1) Quick start (5 minutes)</h2>
        <ol className="list-decimal list-inside space-y-2 text-zinc-300">
          <li>
            Go to <Link className="text-emerald-400 hover:text-emerald-300" href="/notarize">Notarize</Link>.
          </li>
          <li>Select a file (the file stays on your device).</li>
          <li>Choose <span className="text-zinc-100 font-medium">Public Hash</span> or <span className="text-zinc-100 font-medium">Private Commitment</span>.</li>
          <li>(Optional) Enable <span className="text-zinc-100 font-medium">Sign with MetaMask</span> to attach a signer identity.</li>
          <li>Click <span className="text-zinc-100 font-medium">Submit to Hedera</span>.</li>
          <li>Save the receipt link. For Private Commitment, also save the reveal bundle (it contains the salt).</li>
          <li>
            Later, go to <Link className="text-emerald-400 hover:text-emerald-300" href="/verify">Verify</Link> and verify by uploading the file
            (and providing the salt/bundle for commitments).
          </li>
        </ol>
      </section>

      <section id="what-it-is" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">2) What this is (in plain English)</h2>
        <div className="space-y-4 text-zinc-300">
          <p>
            A <span className="text-zinc-100 font-medium">hash</span> is like a “fingerprint” of a file. If the file changes, the fingerprint changes.
          </p>
          <p>
            Notary Log computes that fingerprint in your browser and anchors it to Hedera Consensus Service (HCS). HCS provides an ordered, timestamped
            log. Later, anyone can check the log (via a Mirror Node) to confirm the fingerprint was recorded.
          </p>
          <p className="text-zinc-400">
            Important: this is not legal notarization. It’s tamper-evident proof-of-existence / audit trail tooling.
          </p>
        </div>
      </section>

      <section id="what-it-proves" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">3) What it proves / what it doesn’t</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">It can prove</h3>
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>A specific hash/commitment was recorded on Hedera at/around a consensus timestamp.</li>
              <li>If you have the same file later, you can prove it matches the recorded hash/commitment.</li>
              <li>If MetaMask signing was used, which EVM address signed the notarization payload.</li>
            </ul>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">It does not prove</h3>
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>Legal notarization, authorship, ownership, or intent.</li>
              <li>The document contents (only hash/commitment is anchored).</li>
              <li>Real-world identity (an address is not a person).</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="privacy-modes" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">4) Privacy modes</h2>
        <div className="space-y-6 text-zinc-300">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Public Hash (default)</h3>
            <p className="text-zinc-400">
              The SHA-256 hash of the file is stored on Hedera. Anyone who has the file can compute the same hash and verify it.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Private Commitment (recommended for sensitive docs)</h3>
            <p className="text-zinc-400 mb-3">
              Instead of storing the raw file hash on Hedera, the app stores a salted commitment. The salt never leaves your device.
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>You must save the <span className="text-zinc-100 font-medium">reveal bundle</span> (contains the salt) to verify later.</li>
              <li>If you lose the salt, you may not be able to prove the match later.</li>
              <li>You can optionally store reveal bundles in local history, but that is less secure than offline storage.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="how-to-use" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">5) How to use (step-by-step)</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">Notarize</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Open <Link className="text-emerald-400 hover:text-emerald-300" href="/notarize">Notarize</Link>.</li>
              <li>Select a file. The app hashes it locally.</li>
              <li>Pick mode: Public Hash or Private Commitment.</li>
              <li>(Optional) Enable MetaMask signing.</li>
              <li>Click Submit. Save the receipt link.</li>
              <li>If Private Commitment: download and store the reveal bundle.</li>
            </ol>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">Verify</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Open <Link className="text-emerald-400 hover:text-emerald-300" href="/verify">Verify</Link>.</li>
              <li>Choose verification mode (Public Hash or Private Commitment).</li>
              <li>Upload the file (recommended) or paste a hash/commitment.</li>
              <li>If Private Commitment: paste salt or upload the reveal bundle.</li>
              <li>Adjust “Search depth” if your entry is older or the topic is high-volume.</li>
              <li>Review matches: consensus time, sequence number, and signature validity (if present).</li>
            </ol>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">6) How it works (technical, short)</h2>
        <div className="space-y-4 text-zinc-300">
          <p className="text-zinc-400">
            You do not need to understand this section to use the app, but it’s helpful for reviewers and builders.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="text-zinc-100 font-medium">Client hashing:</span> uses Web Crypto API to compute SHA-256 in the browser.
            </li>
            <li>
              <span className="text-zinc-100 font-medium">Submission:</span> Next.js API route submits JSON payloads to HCS via Hedera SDK.
            </li>
            <li>
              <span className="text-zinc-100 font-medium">Verification:</span> server queries Mirror Node topic messages, decodes, parses JSON, matches hash/commitment.
            </li>
            <li>
              <span className="text-zinc-100 font-medium">Wallet signing:</span> MetaMask signs EIP-712 typed data; server recovers signer address and stores signature metadata on-chain.
            </li>
          </ul>
        </div>
      </section>

      <section id="threat-model" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">7) Threat model (what can go wrong)</h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-zinc-300">
          <ul className="list-disc list-inside space-y-2">
            <li><span className="text-zinc-100 font-medium">File changed:</span> even one byte changes SHA-256 → verify fails.</li>
            <li><span className="text-zinc-100 font-medium">Wrong topic/network:</span> testnet vs mainnet mismatch or wrong topicId → “not found”.</li>
            <li><span className="text-zinc-100 font-medium">Commitment salt lost:</span> without the salt (or reveal bundle), you may not be able to verify commitments later.</li>
            <li><span className="text-zinc-100 font-medium">Local storage exposure:</span> if you store reveal bundles locally, anyone with access to your browser profile may retrieve salts.</li>
            <li><span className="text-zinc-100 font-medium">Search depth too low:</span> verification scans a bounded number of pages → increase search depth for older entries.</li>
            <li><span className="text-zinc-100 font-medium">Signer confusion:</span> an address is not a person; identity requires external binding (e.g., org policy, KYC, etc.).</li>
          </ul>
        </div>
      </section>

      <section id="build-guide" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">8) How to build / run it (for beginners)</h2>
        <div className="space-y-4 text-zinc-300">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Node.js 18+</li>
              <li>A Hedera testnet account + an HCS topic</li>
            </ul>
            <p className="text-sm text-zinc-500 mt-3">
              If you’re new to Hedera testnet setup, follow <code className="text-zinc-300">HEDERA_SETUP.md</code>.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Run locally</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Copy <code className="text-zinc-300">.env.example</code> to <code className="text-zinc-300">.env.local</code>.</li>
              <li>Fill in Hedera credentials and topicId.</li>
              <li>Run <code className="text-zinc-300">npm install</code> then <code className="text-zinc-300">npm run dev</code>.</li>
              <li>Open <code className="text-zinc-300">http://localhost:3000</code>.</li>
            </ol>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Deploy to Vercel</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Import the repo into Vercel.</li>
              <li>Add environment variables from <code className="text-zinc-300">.env.example</code> in Vercel settings.</li>
              <li>Deploy.</li>
            </ol>
          </div>
        </div>
      </section>

      <section id="faq" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">9) FAQ</h2>
        <div className="space-y-4">
          <details className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <summary className="cursor-pointer text-lg font-semibold text-zinc-100">
              Does this upload my file?
            </summary>
            <p className="mt-3 text-zinc-300">
              No. Hashing happens in your browser. The server only receives the hash/commitment and metadata.
            </p>
          </details>

          <details className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <summary className="cursor-pointer text-lg font-semibold text-zinc-100">
              Why does Verify sometimes say “not found”?
            </summary>
            <ul className="mt-3 text-zinc-300 list-disc list-inside space-y-2">
              <li>You’re using the wrong network (testnet vs mainnet) or the wrong topicId.</li>
              <li>The search depth is too low for an older entry.</li>
              <li>The file has changed (even a tiny change).</li>
              <li>For commitments, you used the wrong salt or lost the reveal bundle.</li>
            </ul>
          </details>

          <details className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <summary className="cursor-pointer text-lg font-semibold text-zinc-100">
              What does MetaMask signing add?
            </summary>
            <p className="mt-3 text-zinc-300">
              It allows verifiers to confirm that a specific EVM address signed the notarization payload.
              It does not prove real-world identity unless you map addresses to identities externally.
            </p>
          </details>
        </div>
      </section>

      <section id="glossary" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-4">10) Glossary</h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-zinc-300">
          <dl className="space-y-3">
            <div>
              <dt className="font-semibold text-zinc-100">Hash (SHA-256)</dt>
              <dd className="text-zinc-400">A deterministic fingerprint of data. Same file → same hash.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-100">Commitment</dt>
              <dd className="text-zinc-400">A privacy-preserving value derived from the hash + a secret salt.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-100">Salt</dt>
              <dd className="text-zinc-400">A random secret used to prevent others from learning the underlying hash.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-100">HCS (Hedera Consensus Service)</dt>
              <dd className="text-zinc-400">An ordered, timestamped message log on Hedera.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-100">Mirror Node</dt>
              <dd className="text-zinc-400">A REST API that lets you query HCS topic messages.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-100">EIP-712</dt>
              <dd className="text-zinc-400">A standard for signing structured data with a wallet like MetaMask.</dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="border-t border-zinc-800 pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            Want to jump back in?{' '}
            <Link className="text-emerald-400 hover:text-emerald-300" href="/notarize">
              Notarize
            </Link>{' '}
            ·{' '}
            <Link className="text-emerald-400 hover:text-emerald-300" href="/verify">
              Verify
            </Link>
            {' '}·{' '}
            <Link className="text-emerald-400 hover:text-emerald-300" href="/history">
              History
            </Link>
          </p>
          <a className="text-sm text-zinc-500 hover:text-zinc-300" href="#quickstart">
            Back to top
          </a>
        </div>
      </footer>
    </div>
  );
}

