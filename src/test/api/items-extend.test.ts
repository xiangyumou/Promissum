import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/items/[id]/extend/route';
import { NextRequest } from 'next/server';

// Mock the service function
vi.mock('@/lib/services/items/item-service', () => ({
    extendItem: vi.fn(),
}));

import { extendItem } from '@/lib/services/items/item-service';

describe('Extend Item API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extend item lock time successfully', async () => {
        const mockResult = {
            success: true,
            decryptAt: Date.now() + 7200000,
            layerCount: 2,
        };

        vi.mocked(extendItem).mockResolvedValue(mockResult);

        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: 60 }),
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.decrypt_at).toBeDefined();
        expect(data.layer_count).toBe(2);
        expect(extendItem).toHaveBeenCalledWith('test-id', 60);
    });

    it('should return 400 for invalid request body', async () => {
        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({}), // Missing minutes
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('minutes');
    });

    it('should return 400 for negative minutes', async () => {
        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: -10 }),
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });

        expect(response.status).toBe(400);
    });

    it('should return 400 for zero minutes', async () => {
        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: 0 }),
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });

        expect(response.status).toBe(400);
    });

    it('should return 404 when item not found', async () => {
        vi.mocked(extendItem).mockRejectedValue(new Error('Item not found'));

        const request = new NextRequest('http://localhost/api/items/non-existent/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: 60 }),
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'non-existent' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Item not found');
    });

    it('should return 409 on concurrent modification', async () => {
        vi.mocked(extendItem).mockRejectedValue(new Error('Please retry due to concurrent modification'));

        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: 60 }),
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain('Concurrent modification');
    });

    it('should return 500 on service error', async () => {
        vi.mocked(extendItem).mockRejectedValue(new Error('Encryption service unavailable'));

        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: 60 }),
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Encryption service unavailable');
    });

    it('should extend with large minutes value', async () => {
        const mockResult = {
            success: true,
            decryptAt: Date.now() + 5256000000, // ~100 days
            layerCount: 3,
        };

        vi.mocked(extendItem).mockResolvedValue(mockResult);

        const request = new NextRequest('http://localhost/api/items/test-id/extend', {
            method: 'POST',
            body: JSON.stringify({ minutes: 5256000 }), // 100 days in minutes
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.layer_count).toBe(3);
    });
});
