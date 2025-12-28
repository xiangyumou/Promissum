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
import { persistQueryClient } from '@tanstack/react-query-persist-client';

// Mock external dependencies
vi.mock('@tanstack/react-query-persist-client', () => ({
    persistQueryClient: vi.fn(),
}));

describe('cache-config', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset TTL to default
        setCacheTTL(5);

        // Spy on console
        vi.spyOn(console, 'info').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });

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

    describe('Storage Persistence Fallback', () => {
        it('should fall back to sessionStorage if localStorage fails', () => {
            // Simulate localStorage failure
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceeded');
            });

            const queryClient = new QueryClient();
            initializeQueryPersistence(queryClient);

            expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Falling back to sessionStorage'));
        });

        it('should fall back to memory if both storages fail', () => {
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceeded');
            });
            vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceeded');
            });

            const queryClient = new QueryClient();
            initializeQueryPersistence(queryClient);

            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('sessionStorage also unavailable'));
        });
    });

    describe('initializeQueryPersistence', () => {
        it('should initialize persistence with correct options', () => {
            const queryClient = new QueryClient();

            initializeQueryPersistence(queryClient);

            expect(persistQueryClient).toHaveBeenCalledWith(expect.objectContaining({
                queryClient,
                maxAge: 5 * 60 * 1000, // Default TTL
                buster: 'v1',
            }));
        });

        it('should not persist fetching or error queries', () => {
            const queryClient = new QueryClient();
            initializeQueryPersistence(queryClient);

            expect(persistQueryClient).toHaveBeenCalled();

            // Get the options passed to the first call
            const options = (persistQueryClient as any).mock.calls[0][0];
            const shouldDehydrate = options.dehydrateOptions.shouldDehydrateQuery;

            // Check predicates
            expect(shouldDehydrate({ state: { fetchStatus: 'fetching' } })).toBe(false);
            expect(shouldDehydrate({ state: { status: 'error' } })).toBe(false);
            expect(shouldDehydrate({ state: { fetchStatus: 'idle', status: 'success' } })).toBe(true);
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
});
