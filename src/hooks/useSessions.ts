import { useQuery } from '@tanstack/react-query';
import { ApiActiveSession } from '@/lib/types';

export function useSessions(itemId: string | null) {
    return useQuery({
        queryKey: ['sessions', itemId],
        queryFn: async () => {
            if (!itemId) return [];
            const response = await fetch(`/api/sessions?itemId=${itemId}`);
            if (!response.ok) throw new Error('Failed to fetch sessions');
            return response.json() as Promise<ApiActiveSession[]>;
        },
        enabled: !!itemId,
        refetchInterval: 10000, // Poll every 10 seconds for presence updates
    });
}
