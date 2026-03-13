import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env as _env } from '@/lib/env';

describe('env', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    describe('env object', () => {
        it('should have default dbPath when DATABASE_URL not set', async () => {
            delete process.env.DATABASE_URL;

            vi.resetModules();
            const { env: freshEnv } = await import('@/lib/env');

            expect(freshEnv.dbPath).toBe('./promissum.db');
        });

        it('should use DATABASE_URL when set', async () => {
            process.env.DATABASE_URL = '/custom/path/db.sqlite';

            vi.resetModules();
            const { env: freshEnv } = await import('@/lib/env');

            expect(freshEnv.dbPath).toBe('/custom/path/db.sqlite');
        });
    });
});
