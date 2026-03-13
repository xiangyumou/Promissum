import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/items/route';
import { NextRequest } from 'next/server';

// Mock core modules
vi.mock('@/core/db', () => ({
    createItem: vi.fn().mockResolvedValue({
        id: 'test-id',
        unlocked: false,
        decrypt_at: Date.now() + 3600000,
        created_at: Date.now(),
        content_summary: 'Hello World',
    }),
    listItems: vi.fn(),
}));

vi.mock('@/core/crypto', () => ({
    encrypt: vi.fn().mockResolvedValue({
        ciphertext: 'mock_ciphertext',
        roundNumber: 123456789,
    }),
    DrandError: class DrandError extends Error {
        constructor(message: string, public code: string) {
            super(message);
            this.name = 'DrandError';
        }
    },
}));

describe('POST /api/items', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully create item with text content', async () => {
        const formData = new FormData();
        formData.append('text', 'Hello World');
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

    // Note: File upload tests are skipped in Node.js test environment
    // because FormData file handling differs from browser environment.
    // This functionality is tested manually in the browser.

    it('should successfully create item with text and files', async () => {
        const formData = new FormData();
        formData.append('text', 'Hello World');
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        formData.append('files', mockFile);
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

    it('should return error when no content provided', async () => {
        const formData = new FormData();
        formData.append('durationMinutes', '60');

        const req = new NextRequest('http://localhost/api/items', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);
        // The API returns 500 for validation errors (handled by withApiHandler)
        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toContain('Content is required');
    });
});
