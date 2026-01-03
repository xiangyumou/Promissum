import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('device-id module', () => {
    let localStorageMock: Record<string, string> = {};

    beforeEach(async () => {
        vi.clearAllMocks();

        // Mock localStorage
        localStorageMock = {};
        const mockLocalStorage = {
            getItem: vi.fn((key: string) => localStorageMock[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                localStorageMock[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete localStorageMock[key];
            }),
            clear: vi.fn(() => {
                localStorageMock = {};
            })
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
            configurable: true
        });

        // Mock crypto.randomUUID
        vi.stubGlobal('crypto', {
            randomUUID: vi.fn(() => 'test-uuid-12345')
        });

        // Reset module by re-importing
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getDeviceId', () => {
        it('should generate device ID using UUID', async () => {
            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId = getDeviceId();

            expect(deviceId).toBe('test-uuid-12345');
            expect(crypto.randomUUID).toHaveBeenCalled();
        });

        it('should store generated device ID in localStorage', async () => {
            const { getDeviceId } = await import('@/lib/device-id');
            getDeviceId();

            expect(localStorageMock['promissum_device_id']).toBe('test-uuid-12345');
        });

        it('should retrieve cached device ID from localStorage', async () => {
            const cachedDevice = 'cached-device-789';
            localStorageMock['promissum_device_id'] = cachedDevice;

            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId = getDeviceId();

            expect(deviceId).toBe(cachedDevice);
            expect(crypto.randomUUID).not.toHaveBeenCalled();
        });

        it('should return same device ID on subsequent calls (in-memory cache)', async () => {
            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId1 = getDeviceId();
            const deviceId2 = getDeviceId();
            const deviceId3 = getDeviceId();

            expect(deviceId1).toBe(deviceId2);
            expect(deviceId2).toBe(deviceId3);
            // randomUUID should only be called once
            expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
        });

        it('should handle localStorage errors gracefully', async () => {
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceeded');
            });

            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId = getDeviceId();

            // Should still return a valid UUID despite localStorage failure
            expect(deviceId).toBe('test-uuid-12345');
        });
    });

    describe('getDeviceName', () => {
        it('should detect Chrome on macOS', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            expect(name).toBe('Chrome on macOS');
        });

        it('should detect Safari on macOS', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            expect(name).toBe('Safari on macOS');
        });

        it('should detect Firefox on Windows', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            expect(name).toBe('Firefox on Windows');
        });

        it('should detect Edge on Windows', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            expect(name).toBe('Edge on Windows');
        });

        it('should return "Unknown Browser on Unknown OS" for unrecognized user agent', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Some/Weird/UserAgent',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            expect(name).toBe('Unknown Browser on Unknown OS');
        });
    });

    describe('resetDeviceId', () => {
        it('should clear device ID from localStorage', async () => {
            localStorageMock['promissum_device_id'] = 'old-device-id';

            const { resetDeviceId } = await import('@/lib/device-id');
            resetDeviceId();

            expect(localStorageMock['promissum_device_id']).toBeUndefined();
        });

        it('should clear in-memory cache and generate new ID', async () => {
            let uuidCounter = 0;
            vi.mocked(crypto.randomUUID).mockImplementation(() => `uuid-${++uuidCounter}`);

            const { getDeviceId, resetDeviceId } = await import('@/lib/device-id');
            const firstId = getDeviceId();
            expect(firstId).toBe('uuid-1');

            // Reset and clear module
            resetDeviceId();
            vi.resetModules();

            const { getDeviceId: getDeviceId2 } = await import('@/lib/device-id');
            const secondId = getDeviceId2();

            expect(secondId).toBe('uuid-2');
            expect(firstId).not.toBe(secondId);
        });
    });
});
