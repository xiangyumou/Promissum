/**
 * Cache Configuration Module
 * 
 * Centralized cache management including:
 * - TTL configuration
 * - localStorage persistence with error handling
 * - Fallback to sessionStorage/in-memory cache
 * - Cache size monitoring
 */

import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const CACHE_VERSION = 'v1';
const CACHE_KEY = 'promissum-react-query-cache';
const MAX_CACHE_SIZE_KB = 5000; // 5MB warning threshold

/**
 * Global cache TTL in milliseconds
 * Updated when user changes settings
 */
let globalCacheTTL = 5 * 60 * 1000; // Default: 5 minutes

/**
 * Get current cache TTL
 */
export function getCacheTTL(): number {
    return globalCacheTTL;
}

/**
 * Update global cache TTL
 * This will affect new queries, but won't invalidate existing cache
 */
export function setCacheTTL(minutes: number): void {
    globalCacheTTL = minutes * 60 * 1000;
}

/**
 * Create safe storage persister with fallback
 * 
 * Priority: localStorage -> sessionStorage -> null (memory only)
 */
function createSafePersister() {
    if (typeof window === 'undefined') {
        return null;
    }

    // Try localStorage first
    try {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);

        return createSyncStoragePersister({
            storage: window.localStorage,
            key: CACHE_KEY,
        });
    } catch (error) {
        console.warn('[Cache] localStorage unavailable:', error);

        // Fallback to sessionStorage
        try {
            const testKey = '__storage_test__';
            window.sessionStorage.setItem(testKey, 'test');
            window.sessionStorage.removeItem(testKey);

            return createSyncStoragePersister({
                storage: window.sessionStorage,
                key: CACHE_KEY,
            });
        } catch (_sessionError) {
            console.warn('[Cache] sessionStorage also unavailable, using memory-only cache');
            return null;
        }
    }
}

/**
 * Initialize query client persistence
 * Should be called once during app initialization
 */
export function initializeQueryPersistence(queryClient: QueryClient): void {
    if (typeof window === 'undefined') {
        return;
    }

    const persister = createSafePersister();
    if (!persister) {
        console.warn('[Cache] Persistence disabled, using memory-only cache');
        return;
    }

    try {
        persistQueryClient({
            queryClient,
            persister,
            maxAge: globalCacheTTL,
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
 * Estimate current cache size in KB
 */
export function estimateCacheSize(): number {
    if (typeof window === 'undefined') {
        return 0;
    }

    try {
        const cache = window.localStorage.getItem(CACHE_KEY);
        if (!cache) return 0;

        // Use Blob to get accurate byte size
        const sizeBytes = new Blob([cache]).size;
        return Math.round(sizeBytes / 1024); // Convert to KB
    } catch (error) {
        console.warn('[Cache] Could not estimate cache size:', error);
        return 0;
    }
}

/**
 * Check if cache size exceeds warning threshold
 */
function isCacheSizeExceeded(): boolean {
    return estimateCacheSize() > MAX_CACHE_SIZE_KB;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const sizeKB = estimateCacheSize();
    return {
        sizeKB,
        sizeMB: (sizeKB / 1024).toFixed(2),
        isOverLimit: isCacheSizeExceeded(),
        maxSizeKB: MAX_CACHE_SIZE_KB,
    };
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
        window.sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.warn('[Cache] Failed to clear persisted cache:', error);
    }
}
