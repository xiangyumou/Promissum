import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/preferences/route';
import { NextRequest } from 'next/server';

describe('Preferences API', () => {
    describe('GET', () => {
        it('should return empty object (deprecated)', async () => {
            const req = new NextRequest('http://localhost/api/preferences');
            const res = await GET(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual({});
        });
    });

    describe('POST', () => {
        it('should return success (deprecated)', async () => {
            const req = new NextRequest('http://localhost/api/preferences', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
        });
    });
});
