/**
 * Cache Configuration Module
 *
 * Centralized cache management including:
 * - TTL configuration (from environment variable)
 * - localStorage persistence
 */

import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const CACHE_VERSION = 'v1';
const CACHE_KEY = 'promissum-react-query-cache';

/**
 * Cache TTL in milliseconds
 * Read from environment variable with default of 5 minutes
 */
const CACHE_TTL = parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '5', 10) * 60 * 1000;

/**
 * Get current cache TTL
 */
export function getCacheTTL(): number {
    return CACHE_TTL;
}

/**
 * Create storage persister
 * Uses localStorage, returns null on server
 */
function createPersister() {
    if (typeof window === 'undefined') {
        return null;
    }

    return createSyncStoragePersister({
        storage: window.localStorage,
        key: CACHE_KEY,
    });
}

/**
 * Initialize query client persistence
 * Should be called once during app initialization
 */
export function initializeQueryPersistence(queryClient: QueryClient): void {
    if (typeof window === 'undefined') {
        return;
    }

    const persister = createPersister();
    if (!persister) {
        return;
    }

    try {
        persistQueryClient({
            queryClient,
            persister,
            maxAge: CACHE_TTL,
            buster: CACHE_VERSION,
            dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                    // Don't persist queries that are currently fetching
                    if (query.state.fetchStatus === 'fetching') {
                        return false;
                    }
                    // Don't persist error states
                    if (query.state.status === 'error') {
                        return false;
                    }
                    return true;
                },
            },
        });
    } catch (error) {
        console.error('[Cache] Failed to initialize persistence:', error);
    }
}

/**
 * Clear persisted cache from storage
 */
export function clearPersistedCache(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.warn('[Cache] Failed to clear persisted cache:', error);
    }
}
