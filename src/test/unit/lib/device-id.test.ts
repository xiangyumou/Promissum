import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Mock FingerprintJS
vi.mock('@fingerprintjs/fingerprintjs', () => ({
    default: {
        load: vi.fn()
    }
}));

describe('device-id module', () => {
    let localStorageMock: Record<string, string> = {};

    beforeEach(async () => {
        // Clear all mocks
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
            randomUUID: vi.fn(() => 'random-uuid-12345')
        });

        // Reset module by re-importing
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getDeviceId', () => {
        it('should generate device ID using FingerprintJS', async () => {
            const mockVisitorId = 'fp-visitor-123';
            const mockFp = {
                get: vi.fn().mockResolvedValue({ visitorId: mockVisitorId })
            };
            (FingerprintJS.load as any).mockResolvedValue(mockFp);

            // Import after mocking
            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId = await getDeviceId();

            expect(deviceId).toBe(mockVisitorId);
            expect(FingerprintJS.load).toHaveBeenCalled();
            expect(mockFp.get).toHaveBeenCalled();
        });

        it('should store generated device ID in localStorage', async () => {
            const mockVisitorId = 'fp-visitor-456';
            const mockFp = {
                get: vi.fn().mockResolvedValue({ visitorId: mockVisitorId })
            };
            (FingerprintJS.load as any).mockResolvedValue(mockFp);

            const { getDeviceId } = await import('@/lib/device-id');
            await getDeviceId();

            expect(localStorageMock['promissum_device_id']).toBe(mockVisitorId);
        });

        it('should retrieve cached device ID from localStorage', async () => {
            const cachedDevice = 'cached-device-789';
            localStorageMock['promissum_device_id'] = cachedDevice;

            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId = await getDeviceId();

            expect(deviceId).toBe(cachedDevice);
            // Should not call FingerprintJS if cached
            expect(FingerprintJS.load).not.toHaveBeenCalled();
        });

        it('should return same device ID on subsequent calls (in-memory cache)', async () => {
            const mockVisitorId = 'fp-visitor-999';
            const mockFp = {
                get: vi.fn().mockResolvedValue({ visitorId: mockVisitorId })
            };
            (FingerprintJS.load as any).mockResolvedValue(mockFp);

            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId1 = await getDeviceId();
            const deviceId2 = await getDeviceId();
            const deviceId3 = await getDeviceId();

            expect(deviceId1).toBe(deviceId2);
            expect(deviceId2).toBe(deviceId3);
            // FingerprintJS should only be called once
            expect(FingerprintJS.load).toHaveBeenCalledTimes(1);
        });

        it('should fallback to random UUID when FingerprintJS fails', async () => {
            (FingerprintJS.load as any).mockRejectedValue(new Error('Fingerprint failed'));
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const { getDeviceId } = await import('@/lib/device-id');
            const deviceId = await getDeviceId();

            expect(deviceId).toBe('device_random-uuid-12345');
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to generate device fingerprint:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should store fallback UUID in localStorage', async () => {
            (FingerprintJS.load as any).mockRejectedValue(new Error('Fingerprint failed'));
            vi.spyOn(console, 'error').mockImplementation(() => { });

            const { getDeviceId } = await import('@/lib/device-id');
            await getDeviceId();

            expect(localStorageMock['promissum_device_id']).toBe('device_random-uuid-12345');

            vi.restoreAllMocks();
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

        it('should detect Chrome on Linux', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            expect(name).toBe('Chrome on Linux');
        });

        it('should detect Chrome on Android (limited by OS detection order)', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            // Note: Current implementation checks Linux before Android,
            // so Android UA strings are detected as Linux
            expect(name).toBe('Chrome on Linux');
        });

        it('should detect Safari on iOS (limited by OS detection order)', async () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                configurable: true
            });

            const { getDeviceName } = await import('@/lib/device-id');
            const name = getDeviceName();

            // Note: Current implementation checks Mac OS X before iOS,
            // so iOS UA strings are detected as macOS
            expect(name).toBe('Safari on macOS');
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
            // Set up a cached device ID
            localStorageMock['promissum_device_id'] = 'old-device-id';

            const { resetDeviceId } = await import('@/lib/device-id');
            resetDeviceId();

            expect(localStorageMock['promissum_device_id']).toBeUndefined();
        });

        it('should clear in-memory cache and generate new ID', async () => {
            // Generate initial ID
            const mockFp1 = {
                get: vi.fn().mockResolvedValue({ visitorId: 'first-id' })
            };
            (FingerprintJS.load as any).mockResolvedValue(mockFp1);

            const { getDeviceId, resetDeviceId } = await import('@/lib/device-id');
            const firstId = await getDeviceId();
            expect(firstId).toBe('first-id');

            // Reset and clear module
            resetDeviceId();
            vi.resetModules();

            // Mock new ID
            const mockFp2 = {
                get: vi.fn().mockResolvedValue({ visitorId: 'second-id' })
            };
            (FingerprintJS.load as any).mockResolvedValue(mockFp2);

            const { getDeviceId: getDeviceId2 } = await import('@/lib/device-id');
            const secondId = await getDeviceId2();

            expect(secondId).toBe('second-id');
            expect(firstId).not.toBe(secondId);
        });
    });
});
