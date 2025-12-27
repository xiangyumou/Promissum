/**
 * TanStack Query Client Configuration
 * 
 * Centralized configuration for React Query with optimized defaults
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: how long data is considered fresh
            staleTime: 1000 * 60 * 5, // 5 minutes

            // Cache time: how long unused data stays in cache
            gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime in v4)

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
