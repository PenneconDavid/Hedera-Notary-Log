/**
 * Hedera Mirror Node Operations
 * 
 * Handles querying the Mirror Node REST API for HCS messages.
 */

import { getMirrorNodeBaseUrl, getTopicId } from './client';
import type { HCSMessagePayload, VerifyMatch } from '@/types';

/**
 * Mirror Node message response format
 */
interface MirrorMessage {
  consensus_timestamp: string;
  message: string; // base64 encoded
  payer_account_id: string;
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  topic_id: string;
}

/**
 * Mirror Node API response for topic messages
 */
interface MirrorMessagesResponse {
  messages: MirrorMessage[];
  links?: {
    next?: string;
  };
}

/**
 * Query options for Mirror Node
 */
export interface QueryOptions {
  limit?: number;
  order?: 'asc' | 'desc';
  sequenceNumber?: number;
  timestamp?: string;
  maxPages?: number;
}

/**
 * Fetch messages from Mirror Node for the configured topic
 * 
 * @param options - Query options
 * @returns Promise resolving to array of mirror messages
 */
export async function fetchTopicMessages(options: QueryOptions = {}): Promise<MirrorMessage[]> {
  const baseUrl = getMirrorNodeBaseUrl();
  const topicId = getTopicId();
  const {
    limit = 100,
    order = 'desc',
    maxPages = 10,
  } = options;

  const messages: MirrorMessage[] = [];
  let nextLink: string | null = null;
  let pageCount = 0;

  // Build initial URL
  let url = `${baseUrl}/api/v1/topics/${topicId}/messages?limit=${limit}&order=${order}`;
  
  if (options.sequenceNumber) {
    url += `&sequencenumber=${options.sequenceNumber}`;
  }
  if (options.timestamp) {
    url += `&timestamp=${options.timestamp}`;
  }

  try {
    while (url && pageCount < maxPages) {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Topic might not exist or have no messages yet
          return [];
        }
        throw new Error(`Mirror Node error: ${response.status} ${response.statusText}`);
      }

      const data: MirrorMessagesResponse = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        messages.push(...data.messages);
      }

      // Check for next page
      nextLink = data.links?.next || null;
      url = nextLink ? `${baseUrl}${nextLink}` : '';
      pageCount++;
    }

    return messages;
  } catch (error) {
    console.error('Mirror Node fetch error:', error);
    throw error;
  }
}

/**
 * Search for a specific hash in topic messages
 * 
 * @param hash - The SHA-256 hash to find
 * @param maxPages - Maximum pages to search
 * @returns Promise resolving to array of matches
 */
export async function findHashMatches(hash: string, maxPages: number = 20): Promise<VerifyMatch[]> {
  const topicId = getTopicId();
  const matches: VerifyMatch[] = [];

  try {
    const messages = await fetchTopicMessages({ 
      order: 'desc', 
      limit: 100,
      maxPages 
    });

    for (const msg of messages) {
      try {
        // Decode base64 message
        const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
        const payload: HCSMessagePayload = JSON.parse(decoded);

        // Check if this is a notarylog message with matching hash
        if (
          payload.schema === 'notarylog@2' &&
          payload.content.mode === 'public_hash' &&
          payload.content.hash === hash
        ) {
          matches.push({
            topicId: msg.topic_id || topicId,
            sequenceNumber: msg.sequence_number,
            consensusTimestamp: msg.consensus_timestamp,
            message: payload,
          });
        }
      } catch {
        // Skip messages that aren't valid JSON or don't match schema
        continue;
      }
    }

    return matches;
  } catch (error) {
    console.error('Error finding hash matches:', error);
    throw error;
  }
}

/**
 * Search for a specific commitment in topic messages
 * 
 * @param commitment - The commitment to find
 * @param maxPages - Maximum pages to search
 * @returns Promise resolving to array of matches
 */
export async function findCommitmentMatches(commitment: string, maxPages: number = 20): Promise<VerifyMatch[]> {
  const topicId = getTopicId();
  const matches: VerifyMatch[] = [];

  try {
    const messages = await fetchTopicMessages({ 
      order: 'desc', 
      limit: 100,
      maxPages 
    });

    for (const msg of messages) {
      try {
        // Decode base64 message
        const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
        const payload: HCSMessagePayload = JSON.parse(decoded);

        // Check if this is a notarylog message with matching commitment
        if (
          payload.schema === 'notarylog@2' &&
          payload.content.mode === 'commitment' &&
          payload.content.commitment === commitment
        ) {
          matches.push({
            topicId: msg.topic_id || topicId,
            sequenceNumber: msg.sequence_number,
            consensusTimestamp: msg.consensus_timestamp,
            message: payload,
          });
        }
      } catch {
        // Skip messages that aren't valid JSON or don't match schema
        continue;
      }
    }

    return matches;
  } catch (error) {
    console.error('Error finding commitment matches:', error);
    throw error;
  }
}

/**
 * Get a single message by sequence number
 * 
 * @param sequenceNumber - The sequence number to fetch
 * @returns Promise resolving to the message or null
 */
export async function getMessageBySequence(sequenceNumber: number): Promise<VerifyMatch | null> {
  const baseUrl = getMirrorNodeBaseUrl();
  const topicId = getTopicId();

  try {
    const url = `${baseUrl}/api/v1/topics/${topicId}/messages/${sequenceNumber}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Mirror Node error: ${response.status}`);
    }

    const msg: MirrorMessage = await response.json();
    
    // Decode and parse message
    const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
    const payload: HCSMessagePayload = JSON.parse(decoded);

    return {
      topicId: msg.topic_id || topicId,
      sequenceNumber: msg.sequence_number,
      consensusTimestamp: msg.consensus_timestamp,
      message: payload,
    };
  } catch (error) {
    console.error('Error fetching message by sequence:', error);
    return null;
  }
}

/**
 * Format consensus timestamp for display
 * 
 * @param timestamp - Hedera consensus timestamp (e.g., "1234567890.123456789")
 * @returns Formatted date string
 */
export function formatConsensusTimestamp(timestamp: string): string {
  try {
    // Hedera timestamps are in seconds.nanoseconds format
    const [seconds] = timestamp.split('.');
    const date = new Date(parseInt(seconds) * 1000);
    return date.toISOString();
  } catch {
    return timestamp;
  }
}

