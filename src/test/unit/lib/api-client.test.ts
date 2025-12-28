import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChasterApiClient, createApiClient } from '@/lib/api-client';
import { useSettings } from '@/lib/stores/settings-store';
import { getEffectiveApiUrl, getEffectiveApiToken } from '@/lib/env';

// Mock dependencies
vi.mock('@/lib/stores/settings-store', () => ({
    useSettings: {
        getState: vi.fn(),
    }
}));

vi.mock('@/lib/env', () => ({
    getEffectiveApiUrl: vi.fn(),
    getEffectiveApiToken: vi.fn(),
    env: {
        apiUrl: 'http://env-url.com',
        apiToken: 'env-token'
    }
}));

describe('ChasterApiClient', () => {
    let fetchMock: any;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.clearAllMocks();

        // Setup default mock behaviors
        (useSettings.getState as any).mockReturnValue({
            apiUrl: '',
            apiToken: ''
        });
        (getEffectiveApiUrl as any).mockReturnValue('http://default-url.com');
        (getEffectiveApiToken as any).mockReturnValue('default-token');
    });

    it('should use constructor options if provided', async () => {
        const client = new ChasterApiClient({
            baseUrl: 'http://custom-url.com',
            token: 'custom-token',
            fetchFn: fetchMock
        });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ([])
        });

        await client.getItems();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('http://custom-url.com/items'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer custom-token'
                })
            })
        );
    });

    it('should fallback to env/settings if options not provided', async () => {
        const client = new ChasterApiClient({ fetchFn: fetchMock });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ([])
        });

        await client.getItems();

        expect(getEffectiveApiUrl).toHaveBeenCalled();
        expect(getEffectiveApiToken).toHaveBeenCalled();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('http://default-url.com/items'),
            expect.any(Object)
        );
    });

    it('getItems should format query params correctly', async () => {
        const client = new ChasterApiClient({
            baseUrl: 'http://base.com',
            fetchFn: fetchMock
        });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ([])
        });

        await client.getItems({
            status: 'locked',
            limit: 10,
            sort: 'created_desc'
        });

        const url = fetchMock.mock.calls[0][0];
        expect(url).toContain('status=locked');
        expect(url).toContain('limit=10');
        expect(url).toContain('sort=created_desc');
    });

    it('createItem should send POST request', async () => {
        const client = new ChasterApiClient({
            baseUrl: 'http://base.com',
            fetchFn: fetchMock
        });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '123' })
        });

        const data = { type: 'text' as const, content: 'test' };
        await client.createItem(data);

        expect(fetchMock).toHaveBeenCalledWith(
            'http://base.com/items',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(data)
            })
        );
    });

    it('should throw error on failed request', async () => {
        const client = new ChasterApiClient({ fetchFn: fetchMock });

        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => 'Error message'
        });

        await expect(client.getItems()).rejects.toThrow('API request failed: 400 Bad Request');
    });

    describe('Edge Cases & Errors', () => {
        it('should throw "Item not found" on 404', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: async () => 'Not found',
                json: async () => ({})
            });

            await expect(new ChasterApiClient({ fetchFn: fetchMock }).getItemById('missing')).rejects.toThrow('API request failed: 404');
        });

        it('should throw "Unauthorized" on 401', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => 'Unauthorized',
                json: async () => ({})
            });

            await expect(new ChasterApiClient({ fetchFn: fetchMock }).getStats()).rejects.toThrow('API request failed: 401');
        });

        it('should throw "Server error" on 500', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server error',
                json: async () => ({})
            });

            await expect(new ChasterApiClient({ fetchFn: fetchMock }).getStats()).rejects.toThrow('Server error');
        });

        it('should handle network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network Error'));
            await expect(new ChasterApiClient({ fetchFn: fetchMock }).getStats()).rejects.toThrow('Network Error');
        });
    });
});
