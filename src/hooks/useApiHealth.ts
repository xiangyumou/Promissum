'use client';

import { useQuery } from '@tanstack/react-query';

interface HealthResponse {
    status: string;
    version?: string;
    uptime?: number;
    timestamp?: number;
}

/**
 * Hook to check API health status
 * Automatically refetches every 30 seconds
 */
export function useApiHealth() {
    return useQuery<HealthResponse, Error>({
        queryKey: ['api-health'],
        queryFn: async () => {
            const res = await fetch('/api/health');
            if (!res.ok) {
                throw new Error(`Health check failed: ${res.status}`);
            }
            return res.json();
        },
        refetchInterval: 30000, // Refetch every 30 seconds
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 10000, // Consider data fresh for 10 seconds
    });
}
