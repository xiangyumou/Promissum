import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock the SDK services
vi.mock('@xymou/chaster-client', () => ({
    OpenAPI: {
        BASE: 'http://localhost:3000/api/v1',
        TOKEN: undefined,
    },
    ItemsService: {
        getItems1: vi.fn(),
        postItems: vi.fn(),
        getItems: vi.fn(),
        postItemsExtend: vi.fn(),
        deleteItems: vi.fn(),
    },
    SystemService: {
        getStats: vi.fn(),
    },
}));

import { ItemsService, SystemService } from '@xymou/chaster-client';

describe('ChasterApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock behaviors
        (useSettings.getState as ReturnType<typeof vi.fn>).mockReturnValue({
            apiUrl: '',
            apiToken: ''
        });
        (getEffectiveApiUrl as ReturnType<typeof vi.fn>).mockReturnValue('http://default-url.com');
        (getEffectiveApiToken as ReturnType<typeof vi.fn>).mockReturnValue('default-token');
    });

    describe('getItems', () => {
        it('should fetch items and transform to snake_case format', async () => {
            const mockItems = [
                { id: '1', type: 'text', unlocked: false, decryptAt: 1234567890 },
                { id: '2', type: 'image', unlocked: true, decryptAt: 9876543210 },
            ];
            (ItemsService.getItems1 as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockItems });

            const client = new ChasterApiClient();
            const result = await client.getItems();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: '1',
                type: 'text',
                unlocked: false,
                decrypt_at: 1234567890,
                created_at: undefined,
                metadata: undefined,
            });
        });

        it('should pass filter parameters to SDK', async () => {
            (ItemsService.getItems1 as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [] });

            const client = new ChasterApiClient();
            await client.getItems({ status: 'locked', type: 'text', limit: 10 });

            expect(ItemsService.getItems1).toHaveBeenCalledWith({
                status: 'locked',
                type: 'text',
                limit: 10,
                offset: undefined,
            });
        });
    });

    describe('createItem', () => {
        it('should create item and transform response to snake_case', async () => {
            const mockCreatedItem = {
                id: 'new-id',
                type: 'text',
                unlocked: false,
                decryptAt: 1234567890,
                content: null,
            };
            (ItemsService.postItems as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedItem);

            const client = new ChasterApiClient();
            const result = await client.createItem({
                type: 'text',
                content: 'test content',
                durationMinutes: 60,
            });

            expect(result.id).toBe('new-id');
            expect(result.type).toBe('text');
            expect(result.decrypt_at).toBe(1234567890);
        });
    });

    describe('getItemById', () => {
        it('should fetch single item by ID and transform to snake_case', async () => {
            const mockItem = {
                id: 'test-id',
                type: 'text',
                unlocked: true,
                decryptAt: 1234567890,
                content: 'decrypted content',
            };
            (ItemsService.getItems as ReturnType<typeof vi.fn>).mockResolvedValue(mockItem);

            const client = new ChasterApiClient();
            const result = await client.getItemById('test-id');

            expect(result.id).toBe('test-id');
            expect(result.content).toBe('decrypted content');
            expect(result.decrypt_at).toBe(1234567890);
            expect(ItemsService.getItems).toHaveBeenCalledWith({ id: 'test-id' });
        });
    });

    describe('extendItem', () => {
        it('should extend item lock duration', async () => {
            const mockExtendedItem = {
                id: 'test-id',
                decryptAt: 9999999999,
                unlocked: false,
            };
            (ItemsService.postItemsExtend as ReturnType<typeof vi.fn>).mockResolvedValue(mockExtendedItem);

            const client = new ChasterApiClient();
            const result = await client.extendItem('test-id', 60);

            expect(result.decrypt_at).toBe(9999999999);
            expect(ItemsService.postItemsExtend).toHaveBeenCalledWith({
                id: 'test-id',
                requestBody: { minutes: 60 },
            });
        });
    });

    describe('deleteItem', () => {
        it('should delete item and return success', async () => {
            (ItemsService.deleteItems as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            const client = new ChasterApiClient();
            const result = await client.deleteItem('test-id');

            expect(result).toEqual({ success: true });
            expect(ItemsService.deleteItems).toHaveBeenCalledWith({ id: 'test-id' });
        });
    });

    describe('getStats', () => {
        it('should fetch and transform system stats', async () => {
            const mockStats = {
                totalItems: 100,
                lockedItems: 60,
                unlockedItems: 40,
                byType: { text: 70, image: 30 },
            };
            (SystemService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

            const client = new ChasterApiClient();
            const result = await client.getStats();

            expect(result.totalItems).toBe(100);
            expect(result.lockedItems).toBe(60);
            expect(result.byType.text).toBe(70);
        });
    });

    describe('createApiClient', () => {
        it('should create a new ChasterApiClient instance', () => {
            const client = createApiClient();
            expect(client).toBeInstanceOf(ChasterApiClient);
        });

        it('should accept custom options', () => {
            const client = createApiClient({
                baseUrl: 'http://custom.com',
                token: 'custom-token',
            });
            expect(client).toBeInstanceOf(ChasterApiClient);
        });
    });
});
