import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getCacheTTL,
    setCacheTTL,
    estimateCacheSize,
    getCacheStats,
    clearPersistedCache,
    initializeQueryPersistence
} from '@/lib/cache-config';
import { QueryClient } from '@tanstack/react-query';

describe('cache-config', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset TTL to default
        setCacheTTL(5);

        // Mock localStorage
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value + ''; }),
            removeItem: vi.fn((key) => { delete store[key]; }),
            clear: vi.fn(() => { for (const k in store) delete store[k]; })
        });

        // Mock sessionStorage
        const sessionStore: Record<string, string> = {};
        vi.stubGlobal('sessionStorage', {
            getItem: vi.fn((key) => sessionStore[key] || null),
            setItem: vi.fn((key, value) => { sessionStore[key] = value + ''; }),
            removeItem: vi.fn((key) => { delete sessionStore[key]; }),
            clear: vi.fn(() => { for (const k in sessionStore) delete sessionStore[k]; })
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('TTL management', () => {
        it('should get default TTL', () => {
            expect(getCacheTTL()).toBe(5 * 60 * 1000);
        });

        it('should update TTL', () => {
            setCacheTTL(10);
            expect(getCacheTTL()).toBe(10 * 60 * 1000);
        });
    });

    describe('Storage management', () => {
        it('should estimate cache size', () => {
            localStorage.setItem('promissum-react-query-cache', '1234567890');
            const size = estimateCacheSize();
            // 10 bytes / 1024 = 0.009... -> round to 0
            expect(size).toBe(0);

            // Larger content
            const largeContent = 'a'.repeat(1024 * 5); // 5KB
            localStorage.setItem('promissum-react-query-cache', largeContent);
            expect(estimateCacheSize()).toBe(5);
        });

        it('should return 0 if cache empty', () => {
            expect(estimateCacheSize()).toBe(0);
        });

        it('should get cache stats', () => {
            const stats = getCacheStats();
            expect(stats).toHaveProperty('sizeKB');
            expect(stats).toHaveProperty('isOverLimit');
        });

        it('should clear persisted cache', () => {
            localStorage.setItem('promissum-react-query-cache', 'data');
            clearPersistedCache();
            expect(localStorage.removeItem).toHaveBeenCalledWith('promissum-react-query-cache');
        });
    });

    describe('initializeQueryPersistence', () => {
        it('should initialize without error', () => {
            const queryClient = new QueryClient();
            expect(() => initializeQueryPersistence(queryClient)).not.toThrow();
        });
    });
});
