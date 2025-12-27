/**
 * MSW Request Handlers
 *
 * Mock API handlers for testing. These intercept fetch requests
 * and return mock data, allowing tests to run without external services.
 */

import { http, HttpResponse } from 'msw';

// Mock data factories
export const mockItems = [
    {
        id: 'test-item-1',
        type: 'text' as const,
        original_name: null,
        decrypt_at: Date.now() + 3600000, // 1 hour from now
        created_at: Date.now() - 86400000, // 1 day ago
        layer_count: 1,
        metadata: { title: 'Test Note 1' },
    },
    {
        id: 'test-item-2',
        type: 'image' as const,
        original_name: 'test-image.png',
        decrypt_at: Date.now() - 3600000, // 1 hour ago (unlocked)
        created_at: Date.now() - 172800000, // 2 days ago
        layer_count: 1,
        metadata: null,
    },
];

export const mockStats = {
    totalItems: 10,
    lockedItems: 7,
    unlockedItems: 3,
    textItems: 6,
    imageItems: 4,
};

export const handlers = [
    // GET /api/items - List items
    http.get('/api/items', () => {
        return HttpResponse.json({
            items: mockItems,
            lastDuration: 720,
        });
    }),

    // GET /api/items/:id - Get item detail
    http.get('/api/items/:id', ({ params }) => {
        const item = mockItems.find((i) => i.id === params.id);
        if (!item) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Simulate decrypted content for unlocked items
        const isUnlocked = Date.now() >= item.decrypt_at;
        return HttpResponse.json({
            ...item,
            unlocked: isUnlocked,
            content: isUnlocked
                ? item.type === 'text'
                    ? 'Mock decrypted text content'
                    : 'base64-mock-image-data'
                : null,
        });
    }),

    // POST /api/items - Create item
    http.post('/api/items', async () => {
        return HttpResponse.json({
            success: true,
            item: {
                id: 'new-test-item',
                type: 'text',
                original_name: null,
                decrypt_at: Date.now() + 3600000,
                created_at: Date.now(),
                layer_count: 1,
                metadata: null,
            },
        });
    }),

    // POST /api/items/:id/extend - Extend lock
    http.post('/api/items/:id/extend', async ({ params }) => {
        const item = mockItems.find((i) => i.id === params.id);
        if (!item) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return HttpResponse.json({
            ...item,
            decrypt_at: item.decrypt_at + 3600000, // +1 hour
        });
    }),

    // DELETE /api/items/:id - Delete item
    http.delete('/api/items/:id', () => {
        return HttpResponse.json({ success: true });
    }),

    // GET /api/stats - Get statistics
    http.get('/api/stats', () => {
        return HttpResponse.json(mockStats);
    }),

    // GET /api/health - Health check
    http.get('/api/health', () => {
        return HttpResponse.json({ status: 'ok' });
    }),
];
