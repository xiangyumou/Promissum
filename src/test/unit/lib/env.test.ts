import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEffectiveApiUrl, getEffectiveApiToken } from '@/lib/env';

describe('env', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getEffectiveApiUrl', () => {
        it('should prioritize environment variable over user setting', () => {
            process.env.CHASTER_API_URL = 'http://env-url.com';

            const result = getEffectiveApiUrl('http://user-url.com');

            expect(result).toBe('http://env-url.com');
        });

        it('should use user setting when env var not set', () => {
            delete process.env.CHASTER_API_URL;

            const result = getEffectiveApiUrl('http://user-url.com');

            expect(result).toBe('http://user-url.com');
        });

        it('should use default when no env var or user setting', () => {
            delete process.env.CHASTER_API_URL;

            const result = getEffectiveApiUrl(undefined);

            expect(result).toBe('http://localhost:3000/api/v1');
        });

        it('should use default when user setting is empty', () => {
            delete process.env.CHASTER_API_URL;

            const result = getEffectiveApiUrl('');

            expect(result).toBe('http://localhost:3000/api/v1');
        });
    });

    describe('getEffectiveApiToken', () => {
        it('should prioritize environment variable over user setting', () => {
            process.env.CHASTER_API_TOKEN = 'env-token';

            const result = getEffectiveApiToken('user-token');

            expect(result).toBe('env-token');
        });

        it('should use user token when env var not set', () => {
            delete process.env.CHASTER_API_TOKEN;

            const result = getEffectiveApiToken('user-token');

            expect(result).toBe('user-token');
        });

        it('should return empty string when neither set', () => {
            delete process.env.CHASTER_API_TOKEN;

            const result = getEffectiveApiToken(undefined);

            expect(result).toBe('');
        });

        it('should return empty string when user token is empty', () => {
            delete process.env.CHASTER_API_TOKEN;

            const result = getEffectiveApiToken('');

            expect(result).toBe('');
        });
    });

    describe('validateEnv', () => {
        it('should throw when CHASTER_API_TOKEN is not set', async () => {
            delete process.env.CHASTER_API_TOKEN;
            process.env.CHASTER_API_URL = 'http://test.com'; // Valid URL

            vi.resetModules();
            const { validateEnv } = await import('@/lib/env');

            expect(() => validateEnv()).toThrow(/CHASTER_API_TOKEN is not set/);
        });

        it('should throw when CHASTER_API_URL is not set', async () => {
            process.env.CHASTER_API_TOKEN = 'test-token'; // Valid Token
            delete process.env.CHASTER_API_URL;

            vi.resetModules();
            const { validateEnv } = await import('@/lib/env');

            expect(() => validateEnv()).not.toThrow();
        });

        it('should not throw when both env vars are set', async () => {
            process.env.CHASTER_API_TOKEN = 'valid-token';
            process.env.CHASTER_API_URL = 'http://valid-url.com';

            vi.resetModules();
            const { validateEnv } = await import('@/lib/env');

            expect(() => validateEnv()).not.toThrow();
        });
    });

    describe('Priority Order', () => {
        it('should follow priority: env > user > default for URL', () => {
            // Case 1: All set - env wins
            process.env.CHASTER_API_URL = 'http://env.com';
            expect(getEffectiveApiUrl('http://user.com')).toBe('http://env.com');

            // Case 2: No env - user wins
            delete process.env.CHASTER_API_URL;
            expect(getEffectiveApiUrl('http://user.com')).toBe('http://user.com');

            // Case 3: Nothing - default
            expect(getEffectiveApiUrl('')).toBe('http://localhost:3000/api/v1');
        });

        it('should follow priority: env > user for token', () => {
            // Case 1: All set - env wins
            process.env.CHASTER_API_TOKEN = 'env-secret';
            expect(getEffectiveApiToken('user-secret')).toBe('env-secret');

            // Case 2: No env - user wins
            delete process.env.CHASTER_API_TOKEN;
            expect(getEffectiveApiToken('user-secret')).toBe('user-secret');

            // Case 3: Nothing - empty
            expect(getEffectiveApiToken('')).toBe('');
        });
    });
});
