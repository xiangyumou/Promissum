import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('Health API', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', mockFetch);

        // Mock successful health check response by default
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: 12345
            })
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return health status', async () => {
        const req = new NextRequest('http://localhost/api/health');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data).toMatchObject({
            status: 'ok',
        });
        expect(data.timestamp).toBeDefined();
        expect(data.uptime).toBeDefined();
    });

    it('should handle remote API failure', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 503,
        });

        const req = new NextRequest('http://localhost/api/health');
        const res = await GET(req);

        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.status).toBe('error');
    });

    it('should handle network error', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const req = new NextRequest('http://localhost/api/health');
        const res = await GET(req);

        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.status).toBe('error');
        expect(data.message).toBe('Network error');
    });
});
