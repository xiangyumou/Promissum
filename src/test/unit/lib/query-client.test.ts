import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryClient } from '@/lib/query-client';
import { QueryClient } from '@tanstack/react-query';

describe('queryClient', () => {
    describe('Default Configuration', () => {
        it('should have correct default options', () => {
            const options = queryClient.getDefaultOptions();

            expect(options.queries?.staleTime).toBe(1000 * 60 * 5); // 5 mins
            expect(options.queries?.retry).toBe(1);
            expect(options.queries?.refetchOnWindowFocus).toBe(true);
        });

        it('should be an instance of QueryClient', () => {
            expect(queryClient).toBeInstanceOf(QueryClient);
        });
    });

    describe('Query Cache Behavior', () => {
        afterEach(() => {
            queryClient.clear();
        });

        it('should store and retrieve queries from cache', async () => {
            const testData = { id: '1', name: 'test' };

            await queryClient.prefetchQuery({
                queryKey: ['test-query'],
                queryFn: () => Promise.resolve(testData)
            });

            const cachedData = queryClient.getQueryData(['test-query']);
            expect(cachedData).toEqual(testData);
        });

        it('should invalidate specific queries', async () => {
            await queryClient.prefetchQuery({
                queryKey: ['items', 'list'],
                queryFn: () => Promise.resolve([{ id: '1' }])
            });

            expect(queryClient.getQueryData(['items', 'list'])).toBeDefined();

            queryClient.invalidateQueries({ queryKey: ['items', 'list'] });
            const state = queryClient.getQueryState(['items', 'list']);
            expect(state?.isInvalidated).toBe(true);
        });

        it('should clear all queries', async () => {
            await queryClient.prefetchQuery({
                queryKey: ['query-1'],
                queryFn: () => Promise.resolve('data-1')
            });
            await queryClient.prefetchQuery({
                queryKey: ['query-2'],
                queryFn: () => Promise.resolve('data-2')
            });

            expect(queryClient.getQueryData(['query-1'])).toBeDefined();
            expect(queryClient.getQueryData(['query-2'])).toBeDefined();

            queryClient.clear();

            expect(queryClient.getQueryData(['query-1'])).toBeUndefined();
            expect(queryClient.getQueryData(['query-2'])).toBeUndefined();
        });
    });

    describe('Retry Configuration', () => {
        it('should respect retry count from default options', () => {
            const options = queryClient.getDefaultOptions();
            // Default retry is 1, meaning 1 retry after initial failure (2 attempts total)
            expect(options.queries?.retry).toBe(1);
        });
    });

    describe('Stale Time Configuration', () => {
        it('should respect staleTime from default options', () => {
            const options = queryClient.getDefaultOptions();
            const fiveMinutesMs = 1000 * 60 * 5;
            expect(options.queries?.staleTime).toBe(fiveMinutesMs);
        });
    });
});
