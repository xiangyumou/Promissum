import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/items/route';
import { NextRequest } from 'next/server';
import { apiClient } from '@/lib/api-client';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
    apiClient: {
        getItems: vi.fn(),
        createItem: vi.fn(),
    }
}));

describe('Items API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        it('should fetch and map items correctly', async () => {
            const mockApiResponse = [
                {
                    id: '1',
                    type: 'text',
                    decryptAt: 1700000000000,
                    createdAt: 1690000000000,
                    unlocked: false,
                    metadata: { title: 'Test 1' }
                }
            ];
            (apiClient.getItems as any).mockResolvedValue(mockApiResponse);

            const req = new NextRequest('http://localhost/api/items?status=locked&sort=created_desc');
            const res = await GET(req);

            expect(res.status).toBe(200);
            const data = await res.json();

            expect(data.items).toHaveLength(1);
            expect(data.items[0]).toEqual({
                id: '1',
                type: 'text',
                decrypt_at: 1700000000000,
                created_at: 1690000000000,
                unlocked: false,
                metadata: { title: 'Test 1' }
            });

            expect(apiClient.getItems).toHaveBeenCalledWith({
                status: 'locked',
                type: undefined,
                sort: 'created_desc'
            });
        });

        it('should handle unexpected API response format', async () => {
            (apiClient.getItems as any).mockResolvedValue({ some: 'other format' });

            const req = new NextRequest('http://localhost/api/items');
            const res = await GET(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.items).toEqual([]);
            expect(data.error).toBe('Unexpected API response format');
        });

        it('should handle API errors with 500 status', async () => {
            (apiClient.getItems as any).mockRejectedValue(new Error('API Failure'));

            const req = new NextRequest('http://localhost/api/items');
            const res = await GET(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBe('Failed to fetch items');
        });
    });

    describe('POST', () => {
        it('should create text item and map response', async () => {
            const mockCreatedItem = {
                id: 'new-id',
                type: 'text',
                decryptAt: 1800000000000,
                unlocked: false,
                metadata: { title: 'New Item' }
            };
            (apiClient.createItem as any).mockResolvedValue(mockCreatedItem);

            const formData = new FormData();
            formData.append('type', 'text');
            formData.append('content', 'secret text');
            formData.append('durationMinutes', '60');
            formData.append('metadata', JSON.stringify({ title: 'New Item' }));

            const req = new NextRequest('http://localhost/api/items', {
                method: 'POST',
                body: formData
            });

            const res = await POST(req);
            expect(res.status).toBe(200);
            const data = await res.json();

            expect(data.success).toBe(true);
            expect(data.item.id).toBe('new-id');
            expect(apiClient.createItem).toHaveBeenCalledWith(expect.objectContaining({
                type: 'text',
                content: 'secret text',
                durationMinutes: 60
            }));
        });

        it('should return 400 if required fields are missing', async () => {
            const formData = new FormData();
            formData.append('type', 'text');
            // missing content and duration

            const req = new NextRequest('http://localhost/api/items', {
                method: 'POST',
                body: formData
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Missing required fields');
        });
    });
});
