import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the logger
vi.mock('@/lib/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock redis client - define mocks before importing
const mockRedis = {
    incr: vi.fn(),
    expire: vi.fn(),
    get: vi.fn(),
};

// Track redis connection state
let redisIsConnected = true;

// Mock the redis module
vi.mock('@/lib/services/rate-limiting/redis', () => ({
    getRedisClient: () => mockRedis,
    isRedisConnected: () => redisIsConnected,
}));

import { checkRateLimit, getRateLimitStats } from '@/lib/services/rate-limiting/ratelimit';
import { logger } from '@/lib/logger';

describe('Rate Limiting Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset redis to connected by default
        redisIsConnected = true;
    });

    afterEach(() => {
        delete process.env.RATE_LIMIT_FAIL_OPEN;
        delete process.env.RATE_LIMIT_WINDOW_MS;
    });

    describe('checkRateLimit', () => {
        it('should allow first request', async () => {
            mockRedis.incr.mockResolvedValue(1);

            const result = await checkRateLimit('test-key', 10, 60000);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(9);
            expect(result.resetAt).toBeGreaterThan(Date.now());
        });

        it('should allow requests within limit', async () => {
            mockRedis.incr.mockResolvedValue(5);

            const result = await checkRateLimit('test-key', 10, 60000);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(5);
        });

        it('should deny requests exceeding limit', async () => {
            mockRedis.incr.mockResolvedValue(11);

            const result = await checkRateLimit('test-key', 10, 60000);

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should set TTL on first request', async () => {
            mockRedis.incr.mockResolvedValue(1);

            await checkRateLimit('test-key', 10, 60000);

            expect(mockRedis.expire).toHaveBeenCalledWith(
                expect.stringContaining('ratelimit:test-key:'),
                60
            );
        });

        it('should not set TTL on subsequent requests', async () => {
            mockRedis.incr.mockResolvedValue(2);

            await checkRateLimit('test-key', 10, 60000);

            expect(mockRedis.expire).not.toHaveBeenCalled();
        });

        it('should use default values when not provided', async () => {
            mockRedis.incr.mockResolvedValue(1);
            delete process.env.RATE_LIMIT_WINDOW_MS;

            await checkRateLimit('test-key');

            expect(mockRedis.expire).toHaveBeenCalledWith(
                expect.stringContaining('ratelimit:test-key:'),
                60
            );
        });

        describe('fail-closed mode (secure)', () => {
            beforeEach(() => {
                process.env.RATE_LIMIT_FAIL_OPEN = 'false';
            });

            it('should deny request when Redis is not connected', async () => {
                redisIsConnected = false;

                const result = await checkRateLimit('test-key', 10, 60000);

                expect(result.allowed).toBe(false);
                expect(result.remaining).toBe(0);
                expect(logger.error).toHaveBeenCalled();
            });

            it('should deny request on Redis error', async () => {
                mockRedis.incr.mockRejectedValue(new Error('Redis connection error'));

                const result = await checkRateLimit('test-key', 10, 60000);

                expect(result.allowed).toBe(false);
                expect(logger.error).toHaveBeenCalled();
            });
        });

        describe('fail-open mode (permissive)', () => {
            beforeEach(() => {
                process.env.RATE_LIMIT_FAIL_OPEN = 'true';
            });

            it('should allow request when Redis is not connected', async () => {
                redisIsConnected = false;

                const result = await checkRateLimit('test-key', 10, 60000);

                expect(result.allowed).toBe(true);
                expect(result.remaining).toBe(10);
                expect(logger.warn).toHaveBeenCalled();
            });

            it('should allow request on Redis error', async () => {
                mockRedis.incr.mockRejectedValue(new Error('Redis connection error'));

                const result = await checkRateLimit('test-key', 10, 60000);

                expect(result.allowed).toBe(true);
                expect(result.remaining).toBe(10);
                expect(logger.error).toHaveBeenCalled();
            });
        });
    });

    describe('getRateLimitStats', () => {
        it('should return stats for existing key', async () => {
            mockRedis.get.mockResolvedValue('5');

            const stats = await getRateLimitStats('test-key', 60000);

            expect(stats).toEqual({
                count: 5,
                resetAt: expect.any(Number),
            });
        });

        it('should return null for non-existent key', async () => {
            mockRedis.get.mockResolvedValue(null);

            const stats = await getRateLimitStats('test-key', 60000);

            expect(stats).toBeNull();
        });

        it('should return null when Redis is not connected', async () => {
            redisIsConnected = false;

            const stats = await getRateLimitStats('test-key', 60000);

            expect(stats).toBeNull();
        });

        it('should return null on Redis error', async () => {
            mockRedis.get.mockRejectedValue(new Error('Redis error'));

            const stats = await getRateLimitStats('test-key', 60000);

            expect(stats).toBeNull();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should use default window when not provided', async () => {
            mockRedis.get.mockResolvedValue('3');
            delete process.env.RATE_LIMIT_WINDOW_MS;

            const stats = await getRateLimitStats('test-key');

            expect(stats?.count).toBe(3);
        });
    });

    describe('window calculation', () => {
        it('should calculate different windows for different keys', async () => {
            mockRedis.incr.mockResolvedValue(1);

            await checkRateLimit('key1', 10, 60000);
            await checkRateLimit('key2', 10, 60000);

            const calls = mockRedis.incr.mock.calls;
            expect(calls.length).toBe(2);

            // Keys should have different window suffixes
            const key1 = calls[0][0];
            const key2 = calls[1][0];
            expect(key1).not.toBe(key2);
        });
    });
});
