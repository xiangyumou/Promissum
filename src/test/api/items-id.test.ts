import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE } from '@/app/api/items/[id]/route';
import { NextRequest } from 'next/server';

// Mock the service functions
vi.mock('@/lib/services/items/item-service', () => ({
    getItemById: vi.fn(),
    deleteItem: vi.fn(),
}));

import { getItemById, deleteItem } from '@/lib/services/items/item-service';

describe('Items ID API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/items/[id]', () => {
        it('should return item by id', async () => {
            const mockItem = {
                id: 'test-id-1',
                type: 'text' as const,
                decryptAt: Date.now() + 3600000,
                createdAt: Date.now() - 3600000,
                unlocked: false,
                content: 'Test content',
                metadata: { title: 'Test Item' },
                timeRemainingMs: 3600000,
                layerCount: 1,
                originalName: null,
            };

            vi.mocked(getItemById).mockResolvedValue(mockItem);

            const request = new NextRequest('http://localhost/api/items/test-id-1');
            const response = await GET(request, { params: Promise.resolve({ id: 'test-id-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.id).toBe('test-id-1');
            expect(data.type).toBe('text');
            expect(data.content).toBe('Test content');
            expect(data.metadata).toEqual({ title: 'Test Item' });
            expect(data.layer_count).toBe(1);
            expect(data.time_remaining_ms).toBe(3600000);
        });

        it('should return 404 when item not found', async () => {
            vi.mocked(getItemById).mockRejectedValue(new Error('Item not found'));

            const request = new NextRequest('http://localhost/api/items/non-existent');
            const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Item not found');
        });

        it('should return 500 on service error', async () => {
            vi.mocked(getItemById).mockRejectedValue(new Error('Database connection failed'));

            const request = new NextRequest('http://localhost/api/items/test-id');
            const response = await GET(request, { params: Promise.resolve({ id: 'test-id' }) });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Database connection failed');
        });

        it('should return item with image type', async () => {
            const mockImageItem = {
                id: 'image-id-1',
                type: 'image' as const,
                decryptAt: Date.now() + 7200000,
                createdAt: Date.now() - 3600000,
                unlocked: false,
                content: 'base64encodedimage',
                metadata: { title: 'Test Image' },
                timeRemainingMs: 7200000,
                layerCount: 2,
                originalName: 'test.png',
            };

            vi.mocked(getItemById).mockResolvedValue(mockImageItem);

            const request = new NextRequest('http://localhost/api/items/image-id-1');
            const response = await GET(request, { params: Promise.resolve({ id: 'image-id-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.id).toBe('image-id-1');
            expect(data.type).toBe('image');
            expect(data.original_name).toBe('test.png');
        });
    });

    describe('DELETE /api/items/[id]', () => {
        it('should delete item successfully', async () => {
            vi.mocked(deleteItem).mockResolvedValue(undefined);

            const request = new NextRequest('http://localhost/api/items/test-id-1', {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: Promise.resolve({ id: 'test-id-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(deleteItem).toHaveBeenCalledWith('test-id-1');
        });

        it('should return 404 when deleting non-existent item', async () => {
            vi.mocked(deleteItem).mockRejectedValue(new Error('Item not found'));

            const request = new NextRequest('http://localhost/api/items/non-existent', {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Item not found');
        });

        it('should return 500 on service error', async () => {
            vi.mocked(deleteItem).mockRejectedValue(new Error('Database connection failed'));

            const request = new NextRequest('http://localhost/api/items/test-id', {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: Promise.resolve({ id: 'test-id' }) });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Database connection failed');
        });
    });
});
