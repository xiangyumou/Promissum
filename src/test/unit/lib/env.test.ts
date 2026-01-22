import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env as _env, validateEnv as _validateEnv } from '@/lib/env';

describe('env', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    describe('env object', () => {
        it('should have default values when env vars not set', async () => {
            delete process.env.CHASTER_API_URL;
            delete process.env.CHASTER_API_TOKEN;
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.NEXT_PUBLIC_DATE_FORMAT;
            delete process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL;
            delete process.env.NEXT_PUBLIC_CACHE_TTL;

            vi.resetModules();
            const { env: freshEnv } = await import('@/lib/env');

            expect(freshEnv.apiUrl).toBe('http://localhost:3000/api/v1');
            expect(freshEnv.apiToken).toBe('');
            expect(freshEnv.appUrl).toBe('http://localhost:3000');
            expect(freshEnv.dateFormat).toBe('yyyy-MM-dd HH:mm');
            expect(freshEnv.autoRefreshInterval).toBe(60);
            expect(freshEnv.cacheTTLMinutes).toBe(5);
        });

        it('should use env vars when set', async () => {
            process.env.CHASTER_API_URL = 'http://test-api.com';
            process.env.CHASTER_API_TOKEN = 'test-token';
            process.env.NEXT_PUBLIC_APP_URL = 'http://test-app.com';
            process.env.NEXT_PUBLIC_DATE_FORMAT = 'dd/MM/yyyy';
            process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL = '30';
            process.env.NEXT_PUBLIC_CACHE_TTL = '10';

            vi.resetModules();
            const { env: freshEnv } = await import('@/lib/env');

            expect(freshEnv.apiUrl).toBe('http://test-api.com');
            expect(freshEnv.apiToken).toBe('test-token');
            expect(freshEnv.appUrl).toBe('http://test-app.com');
            expect(freshEnv.dateFormat).toBe('dd/MM/yyyy');
            expect(freshEnv.autoRefreshInterval).toBe(30);
            expect(freshEnv.cacheTTLMinutes).toBe(10);
        });
    });

    describe('validateEnv', () => {
        it('should throw when CHASTER_API_TOKEN is not set', async () => {
            delete process.env.CHASTER_API_TOKEN;

            vi.resetModules();
            const { validateEnv } = await import('@/lib/env');

            expect(() => validateEnv()).toThrow(/CHASTER_API_TOKEN is not set/);
        });

        it('should not throw when CHASTER_API_TOKEN is set (apiUrl has default)', async () => {
            process.env.CHASTER_API_TOKEN = 'test-token';
            delete process.env.CHASTER_API_URL;

            vi.resetModules();
            const { validateEnv } = await import('@/lib/env');

            expect(() => validateEnv()).not.toThrow();
        });

        it('should not throw when CHASTER_API_TOKEN is set', async () => {
            process.env.CHASTER_API_TOKEN = 'valid-token';
            process.env.CHASTER_API_URL = 'http://valid-url.com';

            vi.resetModules();
            const { validateEnv } = await import('@/lib/env');

            expect(() => validateEnv()).not.toThrow();
        });
    });
});
