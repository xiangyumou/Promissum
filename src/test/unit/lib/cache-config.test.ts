import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getCacheTTL,
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

        // Spy on console
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
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('TTL management', () => {
        it('should get default TTL from environment', () => {
            expect(getCacheTTL()).toBe(5 * 60 * 1000);
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
            const options = vi.mocked(persistQueryClient).mock.calls[0][0] as any;
            const shouldDehydrate = options.dehydrateOptions.shouldDehydrateQuery;

            // Check predicates
            expect(shouldDehydrate({ state: { fetchStatus: 'fetching' } })).toBe(false);
            expect(shouldDehydrate({ state: { status: 'error' } })).toBe(false);
            expect(shouldDehydrate({ state: { fetchStatus: 'idle', status: 'success' } })).toBe(true);
        });
    });

    describe('Storage management', () => {
        it('should clear persisted cache', () => {
            localStorage.setItem('promissum-react-query-cache', 'data');
            clearPersistedCache();
            expect(localStorage.removeItem).toHaveBeenCalledWith('promissum-react-query-cache');
        });
    });
});
