# Hedera Testnet Account Setup Guide

This guide will help you set up a free Hedera testnet account and create an HCS topic for the Notary Log application.

## Prerequisites

- A web browser
- Node.js installed (for running the topic creation script)

## Step 1: Create a Hedera Portal Account

1. **Go to the Hedera Portal**
   - Visit: https://portal.hedera.com/

2. **Sign Up / Log In**
   - Create a new account or log in with an existing one
   - You can use email, Google, or GitHub authentication

3. **Navigate to Testnet**
   - In the portal, select "Testnet" network

4. **Get Your Credentials**
   - Your **Account ID** will be displayed (format: `0.0.123456`)
   - Click "Show Keys" or similar to reveal your **Private Key**
   - **IMPORTANT**: Copy and save your private key securely. Never share it!

## Step 2: Fund Your Account (Automatic on Testnet)

Testnet accounts are automatically funded with HBAR for testing. You should see a balance of 10,000 HBAR or similar.

If you need more testnet HBAR:
- Visit the [Hedera Faucet](https://portal.hedera.com/faucet)
- Or use the portal's refill feature

## Step 3: Create an HCS Topic

You have two options:

### Option A: Use the Portal (Recommended for Beginners)

1. In the Hedera Portal, look for "Topics" or "HCS" section
2. Click "Create Topic"
3. Configure your topic:
   - **Memo**: "Notary Log - Proof of Existence"
   - **Submit Key**: Leave empty for open submission (or set to your key)
   - **Admin Key**: Your account key (optional, allows topic modification)
4. Note your new **Topic ID** (format: `0.0.789012`)

### Option B: Use the CLI Script

After setting up your environment variables, run:

```bash
npm run create-topic
```

This will create a topic and output the Topic ID.

## Step 4: Configure Environment Variables

1. **Copy the example file**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your values:
   ```env
   HEDERA_NETWORK=testnet
   HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
   HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY_HERE
   HEDERA_TOPIC_ID=0.0.YOUR_TOPIC_ID
   MIRROR_NODE_BASE_URL=https://testnet.mirrornode.hedera.com
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Verify your setup**
   ```bash
   npm run dev
   ```

## Security Notes

⚠️ **NEVER commit your `.env.local` file to version control!**

- The `.gitignore` file should already exclude it
- Only use testnet keys during development
- For production (mainnet), use proper key management:
  - Environment variables in Vercel dashboard
  - Secrets management services
  - Hardware security modules (HSM) for high-value applications

## Understanding the Keys

### DER Encoded Private Key
The Hedera SDK expects private keys in DER-encoded hex format. It typically looks like:
```
302e020100300506032b657004220420...
```

If you have an ED25519 private key in raw format (64 hex chars), you may need to convert it.

### Key Formats Supported
- **DER Encoded Hex**: Standard format from Hedera Portal
- **Raw ED25519**: Some tools provide this format
- **Mnemonic Phrase**: Can be converted using `@hashgraph/sdk`

## Verifying Your Setup

Run the development server and check the console for any configuration errors:

```bash
npm run dev
```

Then visit http://localhost:3000 and try notarizing a file.

## Troubleshooting

### "Invalid operator ID or key"
- Double-check your Account ID format (should be `0.0.XXXXXX`)
- Ensure your private key is complete (no truncation during copy/paste)

### "Topic does not exist"
- Verify your Topic ID
- Make sure the topic was created on the same network (testnet vs mainnet)

### "Insufficient balance"
- Visit the Hedera Faucet to get more testnet HBAR
- Testnet accounts are periodically reset, so you may need to recreate

### "CORS errors"
- Mirror Node calls should go through the `/api/verify` endpoint
- Direct browser calls to Mirror Node may be blocked

## Costs (Testnet vs Mainnet)

### Testnet (Free)
- Topic creation: Free
- Message submission: Free
- All operations use test HBAR

### Mainnet (Real Costs)
- Topic creation: ~$0.01 USD
- Message submission: ~$0.0001 USD per message
- Costs are minimal but plan accordingly

## Next Steps

Once your environment is configured:

1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Try notarizing a test file
4. Verify the notarization on the Verify page

## Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera Portal](https://portal.hedera.com/)
- [HCS Overview](https://docs.hedera.com/hedera/core-concepts/hashgraph-consensus-mechanism/hashgraph-consensus-service-hcs)
- [Mirror Node REST API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api)
- [Hedera SDK for JavaScript](https://github.com/hashgraph/hedera-sdk-js)

