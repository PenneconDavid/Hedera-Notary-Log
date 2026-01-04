/**
 * GET /api/verify
 * 
 * Verify a document hash or commitment on Hedera Consensus Service.
 * 
 * Query parameters:
 * - hash: SHA-256 hash to verify (64 hex chars)
 * - commitment: Commitment to verify (hex string)
 * 
 * Response:
 * {
 *   ok: boolean,
 *   found: boolean,
 *   matches: VerifyMatch[],
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { findHashMatches, findCommitmentMatches } from '@/lib/hedera/mirror';
import { isHederaConfigured } from '@/lib/hedera/client';
import { isValidHash, isValidCommitment } from '@/types';
import type { VerifyResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  // Check if Hedera is configured
  if (!isHederaConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        found: false,
        matches: [],
        error: 'Server is not properly configured for Hedera',
      },
      { status: 503 }
    );
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get('hash');
  const commitment = searchParams.get('commitment');

  // Validate: must have either hash or commitment, not both
  if (!hash && !commitment) {
    return NextResponse.json(
      {
        ok: false,
        found: false,
        matches: [],
        error: 'Missing query parameter: provide either "hash" or "commitment"',
      },
      { status: 400 }
    );
  }

  if (hash && commitment) {
    return NextResponse.json(
      {
        ok: false,
        found: false,
        matches: [],
        error: 'Provide only one of "hash" or "commitment", not both',
      },
      { status: 400 }
    );
  }

  // Search by hash
  if (hash) {
    // Normalize to lowercase
    const normalizedHash = hash.toLowerCase();

    // Validate hash format
    if (!isValidHash(normalizedHash)) {
      return NextResponse.json(
        {
          ok: false,
          found: false,
          matches: [],
          error: 'Invalid hash format. Expected 64 lowercase hex characters.',
        },
        { status: 400 }
      );
    }

    try {
      const matches = await findHashMatches(normalizedHash);

      return NextResponse.json({
        ok: true,
        found: matches.length > 0,
        matches,
      });
    } catch (error) {
      console.error('Verify hash error:', error);
      return NextResponse.json(
        {
          ok: false,
          found: false,
          matches: [],
          error: 'Error querying Mirror Node. Please try again.',
        },
        { status: 500 }
      );
    }
  }

  // Search by commitment
  if (commitment) {
    // Normalize to lowercase
    const normalizedCommitment = commitment.toLowerCase();

    // Validate commitment format
    if (!isValidCommitment(normalizedCommitment)) {
      return NextResponse.json(
        {
          ok: false,
          found: false,
          matches: [],
          error: 'Invalid commitment format. Expected hex string (at least 32 chars).',
        },
        { status: 400 }
      );
    }

    try {
      const matches = await findCommitmentMatches(normalizedCommitment);

      return NextResponse.json({
        ok: true,
        found: matches.length > 0,
        matches,
      });
    } catch (error) {
      console.error('Verify commitment error:', error);
      return NextResponse.json(
        {
          ok: false,
          found: false,
          matches: [],
          error: 'Error querying Mirror Node. Please try again.',
        },
        { status: 500 }
      );
    }
  }

  // Should never reach here
  return NextResponse.json(
    {
      ok: false,
      found: false,
      matches: [],
      error: 'Invalid request',
    },
    { status: 400 }
  );
}

// Reject other methods
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET with query parameters.' },
    { status: 405 }
  );
}

