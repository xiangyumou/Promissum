import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockDb = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

vi.mock('@/lib/db/client', () => ({
    db: mockDb,
}));

vi.mock('@/lib/services/encryption/tlock', () => ({
    encrypt: vi.fn(),
    getRoundForTime: vi.fn(),
}));

vi.mock('@/lib/services/encryption/decryption', () => ({
    decrypt: vi.fn(),
}));

// Mock item repository
vi.mock('@/lib/services/items/item-repository', () => ({
    createItemInDb: vi.fn(),
    findItemsInDb: vi.fn(),
    findItemHeaderById: vi.fn(),
    findItemEncryptedData: vi.fn(),
    findItemForExtension: vi.fn(),
    updateItemExtension: vi.fn(),
    deleteItemFromDb: vi.fn(),
}));

import { createItem, getItems, getItemById, extendItem, deleteItem } from '@/lib/services/items/item-service';
import * as itemRepo from '@/lib/services/items/item-repository';
import { encrypt as mockEncrypt, getRoundForTime as mockGetRoundForTime } from '@/lib/services/encryption/tlock';
import { decrypt as mockDecrypt } from '@/lib/services/encryption/decryption';

describe('Item Service', () => {
    const mockUuid = 'test-uuid-12345';
    const mockRoundNumber = 123456789;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid);
        (vi.mocked(mockGetRoundForTime) as any).mockResolvedValue(mockRoundNumber);
        (vi.mocked(mockEncrypt) as any).mockResolvedValue({
            ciphertext: 'mock_encrypted_data',
            roundNumber: mockRoundNumber,
        });
    });

    describe('createItem', () => {
        it('should create a text item with durationMinutes', async () => {
            const now = Date.now();
            const mockItem = {
                id: mockUuid,
                type: 'text',
                encryptedData: 'encrypted_data',
                originalName: null,
                decryptAt: new Date(now + 3600000),
                roundNumber: mockRoundNumber,
                createdAt: new Date(now - 3600000),
                layerCount: 1,
                metadata: null,
            };
            vi.mocked(itemRepo.createItemInDb).mockResolvedValue(mockItem as any);

            const result = await createItem({
                type: 'text',
                content: 'Hello, World!',
                durationMinutes: 60,
            });

            expect(result.type).toBe('text');
            expect(result.id).toBe(mockUuid);
            expect(result.unlocked).toBe(false);
            expect(itemRepo.createItemInDb).toHaveBeenCalled();
        });

        it('should create an image item', async () => {
            const now = Date.now();
            const base64Content = Buffer.from('image data').toString('base64');
            const mockItem = {
                id: mockUuid,
                type: 'image',
                encryptedData: 'mock_encrypted_data',
                originalName: 'image.png',
                decryptAt: new Date(now + 7200000),
                roundNumber: mockRoundNumber,
                createdAt: new Date(now),
                layerCount: 1,
                metadata: null,
            };
            vi.mocked(itemRepo.createItemInDb).mockResolvedValue(mockItem as any);

            const result = await createItem({
                type: 'image',
                content: base64Content,
                durationMinutes: 120,
            });

            expect(result.type).toBe('image');
            expect(result.originalName).toBe('image.png');
        });

        it('should validate that durationMinutes or decryptAt is provided', async () => {
            await expect(createItem({
                type: 'text',
                content: 'Test',
            } as any)).rejects.toThrow();
        });
    });

    describe('getItems', () => {
        it('should return all items with no filters', async () => {
            const now = Date.now();
            const mockItems: any[] = [
                {
                    id: '1',
                    type: 'text',
                    encryptedData: 'encrypted1',
                    originalName: null,
                    decryptAt: new Date(now + 3600000),
                    createdAt: new Date(now - 3600000),
                    layerCount: 1,
                    metadata: null,
                },
                {
                    id: '2',
                    type: 'image',
                    encryptedData: 'encrypted2',
                    originalName: 'image.png',
                    decryptAt: new Date(now - 3600000),
                    createdAt: new Date(now - 7200000),
                    layerCount: 1,
                    metadata: null,
                },
            ];
            vi.mocked(itemRepo.findItemsInDb).mockResolvedValue([mockItems, 2] as any);

            const result = await getItems();

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.items[0].unlocked).toBe(false);
            expect(result.items[1].unlocked).toBe(true);
        });

        it('should filter by locked status', async () => {
            const now = Date.now();
            const mockItems: any[] = [
                {
                    id: '1',
                    type: 'text',
                    encryptedData: 'encrypted1',
                    originalName: null,
                    decryptAt: new Date(now + 3600000),
                    createdAt: new Date(now - 3600000),
                    layerCount: 1,
                    metadata: null,
                },
            ];
            vi.mocked(itemRepo.findItemsInDb).mockResolvedValue([mockItems, 1] as any);

            const result = await getItems({
                status: 'locked',
                limit: 50,
                offset: 0,
                sort: 'created_desc'
            });

            expect(result.items).toHaveLength(1);
            expect(result.items[0].unlocked).toBe(false);
        });
    });

    describe('getItemById', () => {
        it('should return item details', async () => {
            const now = Date.now();
            const mockItem: any = {
                id: '1',
                type: 'text',
                encryptedData: 'encrypted_data',
                originalName: null,
                decryptAt: new Date(now + 3600000),
                createdAt: new Date(now - 3600000),
                layerCount: 1,
                metadata: null,
            };
            vi.mocked(itemRepo.findItemHeaderById).mockResolvedValue(mockItem);

            const result = await getItemById('1');

            expect(result.id).toBe('1');
            expect(result.unlocked).toBe(false);
            expect(result.content).toBeNull();
        });

        it('should decrypt content for unlocked items', async () => {
            const now = Date.now();
            const mockItemHeader: any = {
                id: '1',
                type: 'text',
                originalName: null,
                decryptAt: new Date(now - 3600000), // Past time
                createdAt: new Date(now - 7200000),
                layerCount: 1,
                metadata: null,
            };
            const mockItemSecret: any = {
                encryptedData: 'encrypted_data',
            };

            vi.mocked(itemRepo.findItemHeaderById).mockResolvedValue(mockItemHeader);
            vi.mocked(itemRepo.findItemEncryptedData).mockResolvedValue(mockItemSecret);
            vi.mocked(mockDecrypt).mockResolvedValue(Buffer.from('decrypted content', 'utf-8'));

            const result = await getItemById('1');

            expect(result.unlocked).toBe(true);
            expect(result.content).toBe('decrypted content');
        });

        it('should throw error for non-existent item', async () => {
            vi.mocked(itemRepo.findItemHeaderById).mockResolvedValue(null as any);

            await expect(getItemById('non-existent')).rejects.toThrow('Item not found');
        });
    });

    describe('extendItem', () => {
        it('should extend item lock duration', async () => {
            const now = Date.now();
            const mockItem: any = {
                id: '1',
                type: 'text',
                encryptedData: 'encrypted_data',
                decryptAt: new Date(now + 3600000),
                createdAt: new Date(now - 3600000),
                layerCount: 1,
                metadata: null,
            };
            vi.mocked(itemRepo.findItemForExtension).mockResolvedValue(mockItem);
            vi.mocked(itemRepo.updateItemExtension).mockResolvedValue({ changes: 1 } as any);
            vi.mocked(mockDecrypt).mockResolvedValue(Buffer.from('decrypted', 'utf-8'));

            const result = await extendItem('1', 60);

            expect(result.success).toBe(true);
            expect(result.layerCount).toBe(2);
        });

        it('should throw error for non-existent item', async () => {
            vi.mocked(itemRepo.findItemForExtension).mockResolvedValue(null as any);

            await expect(extendItem('non-existent', 60)).rejects.toThrow('Item not found');
        });

        it('should detect concurrent modification', async () => {
            const now = Date.now();
            const mockItem = {
                id: '1',
                type: 'text',
                encryptedData: 'encrypted_data',
                originalName: null,
                decryptAt: new Date(now + 3600000),
                roundNumber: mockRoundNumber,
                createdAt: new Date(now - 3600000),
                layerCount: 1,
                metadata: null,
            };
            vi.mocked(itemRepo.findItemForExtension).mockResolvedValue(mockItem as any);
            vi.mocked(itemRepo.updateItemExtension).mockRejectedValue(new Error('Item was modified during operation, please retry'));

            await expect(extendItem('1', 60)).rejects.toThrow('retry');
        });

        it('should validate positive minutes', async () => {
            await expect(extendItem('1', -10)).rejects.toThrow();
            await expect(extendItem('1', 0)).rejects.toThrow();
        });
    });

    describe('deleteItem', () => {
        it('should delete item', async () => {
            vi.mocked(itemRepo.deleteItemFromDb).mockResolvedValue(true);

            const result = await deleteItem('1');

            expect(result.success).toBe(true);
        });

        it('should throw error for non-existent item', async () => {
            vi.mocked(itemRepo.deleteItemFromDb).mockRejectedValue(new Error('Item not found'));

            await expect(deleteItem('non-existent')).rejects.toThrow('Item not found');
        });
    });
});
