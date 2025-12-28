import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('Health API', () => {
    it('should return health status', async () => {
        const req = new NextRequest('http://localhost/api/health');
        const res = await GET();

        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data).toMatchObject({
            status: 'ok',
        });
        expect(data.timestamp).toBeDefined();
        expect(data.uptime).toBeDefined();
    });
});
