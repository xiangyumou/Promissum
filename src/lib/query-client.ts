/**
 * TanStack Query Client Configuration
 * 
 * Centralized configuration for React Query with optimized defaults
 * Persistence is handled by cache-config module
 */

import { QueryClient } from '@tanstack/react-query';
import { getCacheTTL } from './cache-config';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: how long data is considered fresh
            // Individual queries can override this with user settings
            staleTime: 1000 * 60 * 5, // 5 minutes default

            // Cache time: how long unused data stays in cache
            // Use dynamic TTL from cache config
            gcTime: getCacheTTL(),

            // Retry failed requests
            retry: 1,

            // Refetch on window focus for real-time updates
            refetchOnWindowFocus: true,

            // Refetch on mount if data is stale
            refetchOnMount: true,

            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Retry failed mutations
            retry: 1,
        },
    },
});

// Note: Persistence is initialized in cache-config.ts
// Call initializeQueryPersistence(queryClient) in app layout
