/**
 * Hedera Client Configuration
 * 
 * Initializes and exports a configured Hedera client for HCS operations.
 * This file runs server-side only - credentials are never exposed to client.
 */

import { Client, AccountId, PrivateKey, Hbar } from '@hashgraph/sdk';

/**
 * Environment variable validation
 */
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

/**
 * Hedera network configuration
 */
export interface HederaConfig {
  network: 'testnet' | 'mainnet';
  operatorId: string;
  operatorKey: string;
  topicId: string;
  mirrorNodeBaseUrl: string;
}

/**
 * Get Hedera configuration from environment variables
 */
export function getHederaConfig(): HederaConfig {
  const network = getEnvVar('HEDERA_NETWORK') as 'testnet' | 'mainnet';
  
  if (network !== 'testnet' && network !== 'mainnet') {
    throw new Error('HEDERA_NETWORK must be "testnet" or "mainnet"');
  }

  return {
    network,
    operatorId: getEnvVar('HEDERA_OPERATOR_ID'),
    operatorKey: getEnvVar('HEDERA_OPERATOR_KEY'),
    topicId: getEnvVar('HEDERA_TOPIC_ID'),
    mirrorNodeBaseUrl: getEnvVar('MIRROR_NODE_BASE_URL'),
  };
}

/**
 * Create a configured Hedera client
 * 
 * IMPORTANT: This should only be called server-side (API routes)
 */
export function createHederaClient(): Client {
  const config = getHederaConfig();

  // Create client for the appropriate network
  const client = config.network === 'mainnet' 
    ? Client.forMainnet() 
    : Client.forTestnet();

  // Set the operator (account that pays for transactions)
  const operatorId = AccountId.fromString(config.operatorId);
  const operatorKey = PrivateKey.fromString(config.operatorKey);
  
  client.setOperator(operatorId, operatorKey);

  // Set reasonable defaults
  client.setDefaultMaxTransactionFee(new Hbar(100)); // 100 HBAR max (safety limit)
  client.setDefaultMaxQueryPayment(new Hbar(10)); // 10 HBAR max for queries

  return client;
}

/**
 * Get the configured topic ID
 */
export function getTopicId(): string {
  return getEnvVar('HEDERA_TOPIC_ID');
}

/**
 * Get Mirror Node base URL
 */
export function getMirrorNodeBaseUrl(): string {
  return getEnvVar('MIRROR_NODE_BASE_URL');
}

/**
 * Check if Hedera is properly configured
 */
export function isHederaConfigured(): boolean {
  try {
    getHederaConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a safe configuration object for client-side use
 * (excludes sensitive credentials)
 */
export function getSafeConfig(): { network: string; topicId: string } {
  const config = getHederaConfig();
  return {
    network: config.network,
    topicId: config.topicId,
  };
}

