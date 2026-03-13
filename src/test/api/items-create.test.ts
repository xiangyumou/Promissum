import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/items/route';
import { NextRequest } from 'next/server';

// Mock core modules
vi.mock('@/core/db', () => ({
    createItem: vi.fn().mockResolvedValue({
        id: 'test-id',
        type: 'text',
        unlocked: false,
        decrypt_at: Date.now() + 3600000,
        created_at: Date.now(),
        content: 'Hello World',
    }),
    listItems: vi.fn(),
}));

vi.mock('@/core/crypto', () => ({
    encrypt: vi.fn().mockResolvedValue({
        ciphertext: 'mock_ciphertext',
        roundNumber: 123456789,
    }),
}));

describe('POST /api/items', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully create text item with content', async () => {
        const formData = new FormData();
        formData.append('type', 'text');
        formData.append('content', 'Hello World');
        formData.append('durationMinutes', '60');

        const req = new NextRequest('http://localhost/api/items', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
    });

    it('should successfully create image item with base64 content', async () => {
        const formData = new FormData();
        formData.append('type', 'image');
        formData.append('content', 'base64encodedimagedata');
        formData.append('durationMinutes', '60');

        const req = new NextRequest('http://localhost/api/items', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
    });
});
