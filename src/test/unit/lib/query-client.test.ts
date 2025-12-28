import { describe, it, expect } from 'vitest';
import { queryClient } from '@/lib/query-client';

describe('queryClient', () => {
    it('should have correct default options', () => {
        const options = queryClient.getDefaultOptions();

        expect(options.queries?.staleTime).toBe(1000 * 60 * 5); // 5 mins
        expect(options.queries?.retry).toBe(1);
        expect(options.queries?.refetchOnWindowFocus).toBe(true);
    });
});
