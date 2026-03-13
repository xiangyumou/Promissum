/**
 * Core Crypto Module
 *
 * All timelock encryption operations in one place.
 * Replaces: services/encryption/tlock.ts + services/encryption/decryption.ts
 */

import { timelockEncrypt, timelockDecrypt, roundAt, HttpChainClient, Buffer as TlockBuffer } from 'tlock-js';
import { HttpChain } from 'drand-client';

// ============================================
// Error Types
// ============================================

export class DrandError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'DrandError';
    }
}

export class NotReadyError extends DrandError {
    constructor(round: number) {
        super(`Round ${round} not yet available`, 'NOT_READY');
    }
}

export class ConfigError extends DrandError {
    constructor(message: string) {
        super(message, 'CONFIG_ERROR');
    }
}

// ============================================
// Configuration
// ============================================

const CHAIN_URL = process.env.DRAND_CHAIN_URL || 'https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';
const IS_MOCKED = process.env.MOCK_DRAND === 'true' || process.env.NODE_ENV === 'test';

// Validate configuration on module load
if (process.env.NODE_ENV === 'production' && process.env.MOCK_DRAND === 'true') {
    throw new Error('MOCK_DRAND cannot be used in production. Encryption is NOT secure when mocked.');
}

if (!CHAIN_URL.startsWith('https://')) {
    console.warn('Security Warning: DRAND_CHAIN_URL should use HTTPS');
}

// ============================================
// Chain Client (Singleton)
// ============================================

let chainClient: HttpChainClient | null = null;

async function getChainClient(): Promise<HttpChainClient> {
    if (IS_MOCKED) {
        return createMockClient();
    }

    if (!chainClient) {
        try {
            const chain = new HttpChain(CHAIN_URL);
            chainClient = new HttpChainClient(chain);
        } catch {
            throw new DrandError('Failed to initialize drand client', 'INIT_FAILED');
        }
    }
    return chainClient;
}

function createMockClient(): HttpChainClient {
    return {
        chain: () => ({
            info: async () => ({
                period: 3,
                genesis_time: Math.floor(Date.now() / 1000) - 1000000,
                hash: 'mock_hash',
                public_key: 'mock_pk',
                groupHash: 'mock_group_hash',
                schemeID: 'mock_scheme_id',
                metadata: { beaconID: 'quicknet' }
            })
        })
    } as unknown as HttpChainClient;
}

// ============================================
// Public API
// ============================================

/**
 * Get chain info from drand
 */
export async function getChainInfo() {
    const client = await getChainClient();
    return await client.chain().info();
}

/**
 * Calculate the drand round number for a given target time
 */
export async function getRoundForTime(targetTime: Date): Promise<number> {
    if (IS_MOCKED) return 123456789;
    const client = await getChainClient();
    const chainInfo = await client.chain().info();
    return roundAt(targetTime.getTime(), chainInfo);
}

/**
 * Encrypt data with timelock - can only be decrypted after the specified time
 */
export async function encrypt(data: Buffer, decryptAt: Date): Promise<{ ciphertext: string; roundNumber: number }> {
    if (IS_MOCKED) {
        return {
            ciphertext: `mock_ct:${data.toString('base64')}`,
            roundNumber: 123456789
        };
    }

    try {
        const client = await getChainClient();
        const chainInfo = await client.chain().info();
        const roundNumber = roundAt(decryptAt.getTime(), chainInfo);
        const tlockBuffer = TlockBuffer.from(data);
        const ciphertext = await timelockEncrypt(roundNumber, tlockBuffer, client);

        return { ciphertext, roundNumber };
    } catch (error) {
        throw new DrandError(
            `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'ENCRYPT_FAILED'
        );
    }
}

/**
 * Attempt to decrypt timelock-encrypted data.
 * Returns null if the time hasn't been reached yet.
 */
export async function decrypt(ciphertext: string): Promise<Buffer | null> {
    if (IS_MOCKED && ciphertext.startsWith('mock_ct:')) {
        const base64 = ciphertext.split(':')[1];
        return Buffer.from(base64, 'base64');
    }

    try {
        const client = await getChainClient();
        const decrypted = await timelockDecrypt(ciphertext, client);
        return Buffer.from(decrypted);
    } catch (error) {
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('round') || msg.includes('beacon') || msg.includes('future')) {
                return null;
            }
        }
        throw new DrandError(
            `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'DECRYPT_FAILED'
        );
    }
}

/**
 * Decrypt with error throw - for API routes that need strict error handling
 */
export async function decryptOrThrow(ciphertext: string): Promise<Buffer> {
    const result = await decrypt(ciphertext);
    if (!result) {
        throw new Error('Decryption failed - time may not have been reached yet');
    }
    return result;
}

/**
 * Check if content can be decrypted (time has passed)
 */
export function canDecrypt(decryptAt: number): boolean {
    return Date.now() >= decryptAt;
}
