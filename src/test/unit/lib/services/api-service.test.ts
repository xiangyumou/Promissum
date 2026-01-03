import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '@/lib/services/api-service';

describe('ApiService', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    describe('getItems', () => {
        it('should fetch items successfully', async () => {
            const mockItems = [
                { id: '1', type: 'text', metadata: { title: 'Test' } },
                { id: '2', type: 'image', metadata: { title: 'Image' } }
            ];
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: mockItems })
            });

            const result = await apiService.getItems();

            expect(result).toEqual(mockItems);
            expect(fetchMock).toHaveBeenCalled();
            const url = fetchMock.mock.calls[0][0];
            expect(url).toContain('/api/items');
        });

        it('should construct correct query params with filters', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] })
            });

            await apiService.getItems({
                status: 'locked',
                type: 'text',
                sort: 'created_desc'
            });

            const url = fetchMock.mock.calls[0][0];
            expect(url).toContain('status=locked');
            expect(url).toContain('type=text');
            expect(url).toContain('sort=created_desc');
        });

        it('should not include status when "all"', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] })
            });

            await apiService.getItems({ status: 'all' });

            const url = fetchMock.mock.calls[0][0];
            expect(url).not.toContain('status=');
        });

        it('should return empty array when no items', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}) // no items key
            });

            const result = await apiService.getItems();
            expect(result).toEqual([]);
        });

        it('should throw on failed request', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(apiService.getItems()).rejects.toThrow('Failed to fetch items');
        });
    });

    describe('getItem', () => {
        it('should fetch single item by id', async () => {
            const mockItem = { id: '123', type: 'text', content: 'secret' };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockItem
            });

            const result = await apiService.getItem('123');

            expect(result).toEqual(mockItem);
            expect(fetchMock).toHaveBeenCalledWith('/api/items/123');
        });

        it('should throw with status on 404', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            try {
                await apiService.getItem('missing');
                expect.fail('Should have thrown');
            } catch (error) {
                const e = error as Error & { status?: number };
                expect(e.message).toBe('Failed to fetch item');
                expect(e.status).toBe(404);
            }
        });

        it('should throw with status on 401', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            try {
                await apiService.getItem('private');
                expect.fail('Should have thrown');
            } catch (error) {
                const e = error as Error & { status?: number };
                expect(e.status).toBe(401);
            }
        });
    });

    describe('createItem', () => {
        it('should create item with FormData', async () => {
            const mockResponse = { success: true, item: { id: 'new-1' } };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const formData = new FormData();
            formData.append('type', 'text');
            formData.append('content', 'my secret');

            const result = await apiService.createItem(formData);

            expect(result).toEqual(mockResponse);
            expect(fetchMock).toHaveBeenCalledWith('/api/items', {
                method: 'POST',
                body: formData
            });
        });

        it('should throw on validation error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request'
            });

            const formData = new FormData();
            formData.append('type', 'invalid');

            await expect(apiService.createItem(formData)).rejects.toThrow('Failed to create item');
        });
    });

    describe('extendItem', () => {
        it('should extend item lock time', async () => {
            const mockResponse = { id: '123', decrypt_at: Date.now() + 3600000 };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await apiService.extendItem('123', 60);

            expect(result).toEqual(mockResponse);
            expect(fetchMock).toHaveBeenCalledWith('/api/items/123/extend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes: 60 })
            });
        });

        it('should throw with error message from server', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Cannot extend already unlocked item' })
            });

            await expect(apiService.extendItem('123', 60))
                .rejects.toThrow('Cannot extend already unlocked item');
        });

        it('should fallback to generic error if no error in response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({})
            });

            await expect(apiService.extendItem('123', 60))
                .rejects.toThrow('Failed to extend lock');
        });
    });

    describe('deleteItem', () => {
        it('should delete item successfully', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            const result = await apiService.deleteItem('123');

            expect(result).toEqual({ success: true });
            expect(fetchMock).toHaveBeenCalledWith('/api/items/123', {
                method: 'DELETE'
            });
        });

        it('should treat 404 as success (idempotent delete)', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            const result = await apiService.deleteItem('already-deleted');
            expect(result).toEqual({ success: true });
        });

        it('should throw on other errors', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(apiService.deleteItem('123')).rejects.toThrow('Failed to delete item');
        });
    });

    describe('getStats', () => {
        it('should fetch statistics', async () => {
            const mockStats = {
                totalItems: 10,
                lockedItems: 5,
                unlockedItems: 5,
                byType: { text: 6, image: 4 }
            };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockStats
            });

            const result = await apiService.getStats();

            expect(result).toEqual(mockStats);
            expect(fetchMock).toHaveBeenCalledWith('/api/stats');
        });

        it('should throw on error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(apiService.getStats()).rejects.toThrow('Failed to fetch stats');
        });
    });

    describe('Network Errors', () => {
        it('should propagate network failures', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network Error'));

            await expect(apiService.getItems()).rejects.toThrow('Network Error');
        });

        it('should handle timeout errors', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Timeout'));

            await expect(apiService.getStats()).rejects.toThrow('Timeout');
        });
    });
});
