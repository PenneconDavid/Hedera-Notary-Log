/**
 * Hedera Consensus Service (HCS) Operations
 * 
 * Handles message submission to HCS topics.
 * Server-side only - contains credential usage.
 */

import { 
  TopicMessageSubmitTransaction,
  TopicId,
  TransactionReceipt,
  Status
} from '@hashgraph/sdk';
import { createHederaClient, getTopicId } from './client';
import type { HCSMessagePayload } from '@/types';

/**
 * Result of an HCS message submission
 */
export interface HCSSubmitResult {
  success: boolean;
  topicId: string;
  transactionId: string;
  sequenceNumber?: number;
  consensusTimestamp?: string;
  error?: string;
}

/**
 * Submit a message to the configured HCS topic
 * 
 * @param payload - The message payload to submit
 * @returns Promise resolving to submission result
 */
export async function submitToHCS(payload: HCSMessagePayload): Promise<HCSSubmitResult> {
  const topicIdString = getTopicId();
  
  try {
    // Create client
    const client = createHederaClient();
    
    // Parse topic ID
    const topicId = TopicId.fromString(topicIdString);
    
    // Serialize payload to JSON
    const message = JSON.stringify(payload);
    
    // Check message size (HCS limit is 1024 bytes for a single chunk)
    const messageBytes = new TextEncoder().encode(message);
    if (messageBytes.length > 4096) {
      return {
        success: false,
        topicId: topicIdString,
        transactionId: '',
        error: `Message too large: ${messageBytes.length} bytes (max 4096)`,
      };
    }
    
    // Create and execute the transaction
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);
    
    // Execute
    const response = await transaction.execute(client);
    
    // Get transaction ID
    const transactionId = response.transactionId.toString();
    
    // Get receipt (wait for consensus)
    let receipt: TransactionReceipt;
    try {
      receipt = await response.getReceipt(client);
    } catch (receiptError) {
      // Receipt might fail but transaction could still succeed
      console.warn('Could not get receipt:', receiptError);
      return {
        success: true,
        topicId: topicIdString,
        transactionId,
        // Sequence number not available without receipt
      };
    }
    
    // Check status
    if (receipt.status !== Status.Success) {
      return {
        success: false,
        topicId: topicIdString,
        transactionId,
        error: `Transaction failed with status: ${receipt.status.toString()}`,
      };
    }
    
    // Extract sequence number from receipt
    const sequenceNumber = receipt.topicSequenceNumber?.toNumber();
    
    return {
      success: true,
      topicId: topicIdString,
      transactionId,
      sequenceNumber,
      // Consensus timestamp will be available from Mirror Node later
    };
    
  } catch (error) {
    console.error('HCS submission error:', error);
    
    return {
      success: false,
      topicId: topicIdString,
      transactionId: '',
      error: error instanceof Error ? error.message : 'Unknown error during submission',
    };
  }
}

/**
 * Validate an HCS message payload
 * 
 * @param payload - The payload to validate
 * @returns Object with valid flag and optional error message
 */
export function validatePayload(payload: unknown): { valid: boolean; error?: string } {
  // Check if payload is an object
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }
  
  const p = payload as Record<string, unknown>;
  
  // Check schema version
  if (p.schema !== 'notarylog@2') {
    return { valid: false, error: 'Invalid or missing schema version' };
  }
  
  // Check content
  if (!p.content || typeof p.content !== 'object') {
    return { valid: false, error: 'Missing content object' };
  }
  
  const content = p.content as Record<string, unknown>;
  
  // Validate based on mode
  if (content.mode === 'public_hash') {
    // Validate hash
    if (typeof content.hash !== 'string' || !/^[a-f0-9]{64}$/.test(content.hash)) {
      return { valid: false, error: 'Invalid hash format (expected 64 hex chars)' };
    }
    if (content.hashAlg !== 'SHA-256') {
      return { valid: false, error: 'Invalid hash algorithm (expected SHA-256)' };
    }
  } else if (content.mode === 'commitment') {
    // Validate commitment
    if (typeof content.commitment !== 'string' || !/^[a-f0-9]+$/.test(content.commitment)) {
      return { valid: false, error: 'Invalid commitment format' };
    }
    if (content.commitment.length < 32 || content.commitment.length > 128) {
      return { valid: false, error: 'Commitment length out of range' };
    }
  } else {
    return { valid: false, error: 'Invalid content mode (expected public_hash or commitment)' };
  }
  
  // Check meta
  if (!p.meta || typeof p.meta !== 'object') {
    return { valid: false, error: 'Missing meta object' };
  }
  
  const meta = p.meta as Record<string, unknown>;
  
  if (meta.app !== 'notarylog') {
    return { valid: false, error: 'Invalid app identifier' };
  }
  
  // Validate file metadata if present
  if (p.file) {
    const file = p.file as Record<string, unknown>;
    if (typeof file.size !== 'number' || file.size < 0) {
      return { valid: false, error: 'Invalid file size' };
    }
    // Max file size validation (e.g., 10GB)
    if (file.size > 10 * 1024 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds maximum' };
    }
  }
  
  return { valid: true };
}

