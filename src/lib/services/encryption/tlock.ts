import { timelockEncrypt, timelockDecrypt, roundAt, HttpChainClient, Buffer as TlockBuffer } from 'tlock-js';
import { HttpChain } from 'drand-client';

// Define typed errors for predictable failure handling
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

// Drand mainnet quicknet chain (3s rounds)
const CHAIN_URL = process.env.DRAND_CHAIN_URL || 'https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';

// Validate configuration on module load
if (process.env.NODE_ENV === 'production' && process.env.MOCK_DRAND === 'true') {
    console.warn('⚠️ SECURITY WARNING: Running in production with MOCK_DRAND=true. Encryption is NOT secure.');
    console.warn('Please set MOCK_DRAND=false in your .env file for production security.');
    // We allow this to proceed to avoid crashing deployments that intentionally use mocks
}

// Basic URL validation to prevent obvious misconfiguration
if (!CHAIN_URL.startsWith('https://')) {
    console.warn('Security Warning: DRAND_CHAIN_URL should use HTTPS');
}

let chainClient: HttpChainClient | null = null;
const IS_MOCKED = process.env.MOCK_DRAND === 'true' || process.env.NODE_ENV === 'test';

async function getChainClient(): Promise<HttpChainClient> {
    if (IS_MOCKED) {
        // Return a proxy that mimics HttpChainClient structure but throws or returns mocks
        // to avoid "lying types" with {} as HttpChainClient
        return createMockClient();
    }
    
    if (!chainClient) {
        try {
            // Use HttpChain instead of HttpCachingChain to prevent memory leak
            // HttpCachingChain caches all beacons indefinitely, causing OOM after days of uptime
            const chain = new HttpChain(CHAIN_URL);
            chainClient = new HttpChainClient(chain);
    } catch {
        throw new DrandError('Failed to initialize drand client', 'INIT_FAILED');
    }
    }
    return chainClient;
}

function createMockClient(): HttpChainClient {
    // Partial mock implementation sufficient for internal logic if needed,
    // though most exported functions short-circuit IS_MOCKED before using this.
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

export async function getChainInfo() {
    const client = await getChainClient();
    return await client.chain().info();
}

/**
 * Calculate the drand round number for a given target time
 * roundAt(time, chainInfo) returns the round number at the given time
 */
export async function getRoundForTime(targetTime: Date): Promise<number> {
    if (IS_MOCKED) return 123456789;
    const chainInfo = await getChainInfo();
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

        // Convert Node Buffer to tlock-js Buffer
        const tlockBuffer = TlockBuffer.from(data);

        const ciphertext = await timelockEncrypt(
            roundNumber,
            tlockBuffer,
            client
        );

        return {
            ciphertext,
            roundNumber
        };
    } catch (error) {
        throw new DrandError(
            `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            'ENCRYPT_FAILED'
        );
    }
}

/**
 * Attempt to decrypt timelock-encrypted data
 * Returns null if the time hasn't been reached yet
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
        // Map library errors to typed domain errors
        if (error instanceof Error) {
            // tlock-js / drand-client typically throw specific messages for future rounds
            // We still need some string matching until the library exposes typed errors, 
            // but we encapsulate it here.
            const msg = error.message.toLowerCase();
            if (msg.includes('round') || msg.includes('beacon') || msg.includes('future')) {
                // Return null to indicate "not ready yet" - this is a valid state, not a system failure
                return null;
            }
        }
        
        // Re-throw unexpected errors (network issues, invalid ciphertext, etc.)
        throw new DrandError(
            `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'DECRYPT_FAILED'
        );
    }
}

/**
 * Check if content can be decrypted (time has passed)
 */
export function canDecrypt(decryptAt: number): boolean {
    return Date.now() >= decryptAt;
}

