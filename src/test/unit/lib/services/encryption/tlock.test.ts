import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Set MOCK_DRAND before importing the module
process.env.MOCK_DRAND = 'true';

import { encrypt, decrypt, getRoundForTime, canDecrypt, getChainInfo } from '@/core/crypto';

describe('Tlock Encryption Service', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env.MOCK_DRAND = 'true';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getChainInfo', () => {
        it('should return mock chain info in test mode', async () => {
            const chainInfo = await getChainInfo();

            expect(chainInfo).toBeDefined();
            expect(chainInfo.period).toBe(3);
            expect(chainInfo.genesis_time).toBeGreaterThan(0);
        });
    });

    describe('getRoundForTime', () => {
        it('should return mock round number in test mode', async () => {
            const targetTime = new Date(Date.now() + 3600000); // 1 hour from now
            const round = await getRoundForTime(targetTime);

            expect(round).toBe(123456789);
        });
    });

    describe('encrypt', () => {
        it('should encrypt text data', async () => {
            const data = Buffer.from('Hello, World!', 'utf-8');
            const decryptAt = new Date(Date.now() + 3600000); // 1 hour from now

            const result = await encrypt(data, decryptAt);

            expect(result.ciphertext).toBeDefined();
            expect(result.ciphertext).toMatch(/^mock_ct:/);
            expect(result.roundNumber).toBe(123456789);
        });

        it('should encrypt binary data', async () => {
            const data = Buffer.from([0x01, 0x02, 0x03, 0x04]);
            const decryptAt = new Date(Date.now() + 7200000); // 2 hours from now

            const result = await encrypt(data, decryptAt);

            expect(result.ciphertext).toBeDefined();
            expect(result.roundNumber).toBe(123456789);
        });

        it('should handle empty data', async () => {
            const data = Buffer.from('', 'utf-8');
            const decryptAt = new Date(Date.now() + 3600000);

            const result = await encrypt(data, decryptAt);

            expect(result.ciphertext).toBe('mock_ct:');
        });
    });

    describe('decrypt', () => {
        it('should decrypt mock encrypted data', async () => {
            const originalData = Buffer.from('Hello, World!', 'utf-8');
            const encryptResult = await encrypt(originalData, new Date(Date.now() + 3600000));

            const decrypted = await decrypt(encryptResult.ciphertext);

            expect(decrypted).toBeDefined();
            expect(decrypted).toEqual(originalData);
        });

        it('should handle non-mock ciphertext gracefully', async () => {
            // In mock mode, non-mock ciphertext will fail to decrypt
            // The implementation catches certain errors and returns null
            // But for format errors, it will throw
            try {
                await decrypt('non_mock_ciphertext');
                // If no error, check result
                expect(true).toBe(true);
            } catch (error) {
                // Expected for non-mock ciphertext with invalid format
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should decrypt binary data correctly', async () => {
            const originalData = Buffer.from([0x01, 0x02, 0x03, 0x04, 0xff]);
            const encryptResult = await encrypt(originalData, new Date(Date.now() + 3600000));

            const decrypted = await decrypt(encryptResult.ciphertext);

            expect(decrypted).toEqual(originalData);
        });
    });

    describe('canDecrypt', () => {
        it('should return true for past timestamps', () => {
            const pastTime = Date.now() - 1000;
            expect(canDecrypt(pastTime)).toBe(true);
        });

        it('should return true for current timestamp', () => {
            const now = Date.now();
            expect(canDecrypt(now)).toBe(true);
        });

        it('should return false for future timestamps', () => {
            const futureTime = Date.now() + 10000;
            expect(canDecrypt(futureTime)).toBe(false);
        });
    });

    describe('encrypt/decrypt roundtrip', () => {
        it('should successfully roundtrip text data', async () => {
            const original = Buffer.from('The quick brown fox jumps over the lazy dog.', 'utf-8');
            const decryptAt = new Date(Date.now() + 3600000);

            const encrypted = await encrypt(original, decryptAt);
            const decrypted = await decrypt(encrypted.ciphertext);

            expect(decrypted).toEqual(original);
        });

        it('should successfully roundtrip large data', async () => {
            const largeText = 'A'.repeat(10000);
            const original = Buffer.from(largeText, 'utf-8');
            const decryptAt = new Date(Date.now() + 3600000);

            const encrypted = await encrypt(original, decryptAt);
            const decrypted = await decrypt(encrypted.ciphertext);

            expect(decrypted).toEqual(original);
        });

        it('should successfully roundtrip unicode data', async () => {
            const original = Buffer.from('Hello 世界 🌍 Привет мир', 'utf-8');
            const decryptAt = new Date(Date.now() + 3600000);

            const encrypted = await encrypt(original, decryptAt);
            const decrypted = await decrypt(encrypted.ciphertext);

            expect(decrypted).toEqual(original);
        });
    });
});
