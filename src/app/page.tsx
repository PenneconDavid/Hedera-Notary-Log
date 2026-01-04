import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <section className="text-center py-16 sm:py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Powered by Hedera Consensus Service
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          <span className="gradient-text">Proof of Existence</span>
          <br />
          <span className="text-zinc-100">Without the Upload</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Hash your documents locally. Anchor the proof to Hedera. 
          Verify anytime. Your files never leave your device.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/notarize"
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-gradient-to-r from-emerald-500 to-teal-500
              hover:from-emerald-400 hover:to-teal-400
              text-white font-semibold rounded-xl
              transition-all duration-200 shadow-lg shadow-emerald-500/25
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Notarize a Document
          </Link>
          
          <Link
            href="/verify"
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-zinc-800 hover:bg-zinc-700
              text-zinc-100 font-semibold rounded-xl
              transition-all duration-200 border border-zinc-700
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Verify a Document
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-zinc-800">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 card-hover">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-blue-400">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Hash Locally</h3>
            <p className="text-zinc-400">
              Select any file. We compute its SHA-256 hash in your browser. 
              The file never leaves your device.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 card-hover">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-emerald-400">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Anchor to Hedera</h3>
            <p className="text-zinc-400">
              Submit the hash to Hedera Consensus Service. Get an immutable, 
              timestamped, and ordered record.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 card-hover">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-purple-400">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Verify Anytime</h3>
            <p className="text-zinc-400">
              Upload the same file or paste the hash. We find the matching 
              record and show the consensus timestamp.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 border-t border-zinc-800">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Privacy by Design</h2>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Files are hashed <strong className="text-zinc-300">client-side</strong> — they never leave your browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Only cryptographic hashes are stored on Hedera</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Optional <strong className="text-zinc-300">private commitment mode</strong> for enhanced privacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No accounts, no tracking, no data retention</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-zinc-800 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-zinc-400 mb-8">
          Notarize your first document in under a minute.
        </p>
        <Link
          href="/notarize"
          className="
            inline-flex items-center gap-2 px-8 py-4
            bg-gradient-to-r from-emerald-500 to-teal-500
            hover:from-emerald-400 hover:to-teal-400
            text-white font-semibold rounded-xl text-lg
            transition-all duration-200 shadow-lg shadow-emerald-500/25
          "
        >
          Get Started
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
