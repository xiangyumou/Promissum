import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/events/route';
import { NextRequest } from 'next/server';

// Note: Testing SSE streams in JSDOM/Node environment is tricky.
// We primarily verify invalid requests and connection setup headers.

describe('Events API', () => {
    it('should require deviceId parameter', async () => {
        const req = new NextRequest('http://localhost/api/events');
        const res = await GET(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Missing deviceId');
    });

    it('should establish SSE connection with correct headers', async () => {
        const req = new NextRequest('http://localhost/api/events?deviceId=test-device');

        // Mock the stream controller to prevent hanging?
        // Actually the route returns a ReadableStream.

        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/event-stream');
        expect(res.headers.get('Cache-Control')).toBe('no-cache, no-transform');
        expect(res.headers.get('Connection')).toBe('keep-alive');

        // Cleanup the stream (cancel it) to finish the test
        if (res.body) {
            await res.body.cancel();
        }
    });
});
