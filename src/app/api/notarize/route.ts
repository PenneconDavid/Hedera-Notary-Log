/**
 * POST /api/notarize
 * 
 * Submit a document hash to Hedera Consensus Service.
 * 
 * Request body:
 * {
 *   payload: HCSMessagePayload,
 *   clientSignature?: ClientSignature
 * }
 * 
 * Response:
 * {
 *   ok: boolean,
 *   topicId: string,
 *   transactionId: string,
 *   sequenceNumber?: number,
 *   consensusTimestamp?: string,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitToHCS, validatePayload } from '@/lib/hedera/hcs';
import { isHederaConfigured } from '@/lib/hedera/client';
import type { NotarizeRequest, NotarizeResponse } from '@/types';
import { verifyClientSignatureEip712 } from '@/lib/wallet/serverVerify';

// Rate limiting: simple in-memory store (for MVP)
// In production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10);
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest): Promise<NextResponse<NotarizeResponse>> {
  // Check if Hedera is configured
  if (!isHederaConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: 'Server is not properly configured for Hedera',
      },
      { status: 503 }
    );
  }

  // Rate limiting
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: 'Rate limit exceeded. Please try again later.',
      },
      { status: 429 }
    );
  }

  // Parse request body
  let body: NotarizeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: 'Invalid JSON in request body',
      },
      { status: 400 }
    );
  }

  // Validate payload structure
  if (!body.payload) {
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: 'Missing payload in request',
      },
      { status: 400 }
    );
  }

  // Validate payload contents
  const validation = validatePayload(body.payload);
  if (!validation.valid) {
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: validation.error || 'Invalid payload',
      },
      { status: 400 }
    );
  }

  // Check payload size (max 4KB)
  const maxBytes = parseInt(process.env.MAX_MESSAGE_BYTES || '4096', 10);
  const payloadSize = new TextEncoder().encode(JSON.stringify(body.payload)).length;
  if (payloadSize > maxBytes) {
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: `Payload too large: ${payloadSize} bytes (max ${maxBytes})`,
      },
      { status: 400 }
    );
  }

  // TODO: Validate client signature if present
  if (body.clientSignature) {
    // Verify MetaMask EIP-712 signature before submitting to Hedera.
    // ChainId must match the wallet chain used for signing.
    const hederaNetwork = process.env.HEDERA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
    const expectedChainId = hederaNetwork === 'mainnet' ? 295 : 296;

    const verification = await verifyClientSignatureEip712({
      payload: body.payload,
      clientSignature: body.clientSignature,
      chainId: expectedChainId,
    });

    if (!verification.ok) {
      return NextResponse.json(
        {
          ok: false,
          topicId: '',
          transactionId: '',
          error: `Invalid signature: ${verification.error}`,
        },
        { status: 400 }
      );
    }

    // Copy signer object into final on-chain payload (verifiable later)
    body.payload.signer = {
      wallet: 'MetaMask',
      evmAddress: body.clientSignature.evmAddress,
      signature: {
        scheme: 'EIP712',
        signedAt: new Date().toISOString(),
        payloadHash: verification.payloadHash,
        sig: body.clientSignature.sig,
      },
    };
  }

  // Submit to HCS
  try {
    const result = await submitToHCS(body.payload);

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          topicId: result.topicId,
          transactionId: result.transactionId,
          error: result.error || 'Failed to submit to Hedera',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      topicId: result.topicId,
      transactionId: result.transactionId,
      sequenceNumber: result.sequenceNumber,
      consensusTimestamp: result.consensusTimestamp,
    });
  } catch (error) {
    console.error('Notarize error:', error);
    return NextResponse.json(
      {
        ok: false,
        topicId: '',
        transactionId: '',
        error: 'Internal server error during submission',
      },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit notarization.' },
    { status: 405 }
  );
}

