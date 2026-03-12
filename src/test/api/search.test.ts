import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/items/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services/items/item-service', () => ({
    getItems: vi.fn(),
    createItem: vi.fn(),
}));

// Rate limiting removed - no mock needed

import { getItems } from '@/lib/services/items/item-service';

describe('Search API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle search parameter', async () => {
        vi.mocked(getItems).mockResolvedValue({
            items: [],
            total: 0,
        });

        const request = new NextRequest('http://localhost/api/items?search=test');
        await GET(request);

        expect(getItems).toHaveBeenCalledWith(
            expect.objectContaining({
                search: 'test',
            })
        );
    });

    it('should ignore empty search parameter', async () => {
        vi.mocked(getItems).mockResolvedValue({
            items: [],
            total: 0,
        });

        const request = new NextRequest('http://localhost/api/items?search=');
        await GET(request);

        expect(getItems).toHaveBeenCalledWith(
            expect.objectContaining({
                search: undefined,
            })
        );
    });
});
