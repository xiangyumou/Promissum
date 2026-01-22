import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

// Mock the Prisma client
vi.mock('@/lib/db/client', () => ({
    prisma: {
        $queryRaw: vi.fn()
    }
}));

describe('Health API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return health status', async () => {
        const { prisma } = await import('@/lib/db/client');
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);

        const req = new NextRequest('http://localhost/api/health');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data).toMatchObject({
            status: 'ok',
            database: 'connected',
        });
        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
        expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection error', async () => {
        const { prisma } = await import('@/lib/db/client');
        vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection failed'));

        const req = new NextRequest('http://localhost/api/health');
        const res = await GET(req);

        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.status).toBe('error');
        expect(data.message).toBe('Connection failed');
    });

    it('should handle database error with non-production error message', async () => {
        const { prisma } = await import('@/lib/db/client');
        vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Database timeout'));

        const req = new NextRequest('http://localhost/api/health');
        const res = await GET(req);

        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.status).toBe('error');
        expect(data.message).toBe('Database timeout');
    });
});
