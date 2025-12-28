import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveSession } from '@/hooks/useActiveSession';
import * as deviceIdModule from '@/lib/device-id';

// Mock device-id module
vi.mock('@/lib/device-id', () => ({
    getDeviceId: vi.fn()
}));

describe('useActiveSession hook', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    const mockDeviceId = 'test-device-123';

    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        (deviceIdModule.getDeviceId as any).mockResolvedValue(mockDeviceId);

        // Mock navigator.sendBeacon
        vi.stubGlobal('navigator', {
            ...global.navigator,
            sendBeacon: vi.fn()
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('Session Registration', () => {
        it('should register session on mount when itemId is provided', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            renderHook(() => useActiveSession('test-item-1'));

            // Wait for async device ID fetch
            await vi.waitFor(() => {
                expect(deviceIdModule.getDeviceId).toHaveBeenCalled();
            });

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: mockDeviceId,
                        itemId: 'test-item-1'
                    })
                });
            });
        });

        it('should not register session when itemId is null', () => {
            renderHook(() => useActiveSession(null));

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should handle registration errors gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            fetchMock.mockRejectedValue(new Error('Network error'));

            renderHook(() => useActiveSession('test-item-1'));

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to register session:',
                    expect.any(Error)
                );
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Heartbeat Mechanism', () => {
        it('should send heartbeat every 2 minutes', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            renderHook(() => useActiveSession('test-item-1'));

            // Wait for initial registration
            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            // Advance time by 2 minutes
            vi.advanceTimersByTime(2 * 60 * 1000);

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(2);
            });

            // Advance another 2 minutes
            vi.advanceTimersByTime(2 * 60 * 1000);

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(3);
            });
        });

        it('should clear interval on unmount', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            const { unmount } = renderHook(() => useActiveSession('test-item-1'));

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            unmount();

            // Advance time - no more heartbeats should be sent
            vi.advanceTimersByTime(10 * 60 * 1000);

            // Only initial registration + cleanup, no heartbeats
            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(2); // 1 registration + 1 cleanup
            });
        });
    });

    describe('Session Cleanup', () => {
        it('should unregister session on unmount', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            const { unmount } = renderHook(() => useActiveSession('test-item-1'));

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            unmount();

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith(
                    `/api/sessions?deviceId=${mockDeviceId}&itemId=test-item-1`,
                    { method: 'DELETE', keepalive: true }
                );
            });
        });

        it('should use fetch with keepalive for cleanup', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            const { unmount } = renderHook(() => useActiveSession('test-item-1'));

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            unmount();

            await vi.waitFor(() => {
                const cleanupCall = fetchMock.mock.calls.find(
                    call => call[1]?.method === 'DELETE'
                );
                expect(cleanupCall).toBeDefined();
                expect(cleanupCall![1].keepalive).toBe(true);
            });
        });

        it('should handle cleanup errors gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            fetchMock.mockResolvedValueOnce({ ok: true }); // Initial registration
            fetchMock.mockRejectedValueOnce(new Error('Cleanup failed')); // Cleanup fails

            const { unmount } = renderHook(() => useActiveSession('test-item-1'));

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            unmount();

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to unregister session:',
                    expect.any(Error)
                );
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('ItemId Changes', () => {
        it('should re-register when itemId changes', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            const { rerender } = renderHook(
                ({ itemId }) => useActiveSession(itemId),
                { initialProps: { itemId: 'item-1' } }
            );

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            // Change itemId
            rerender({ itemId: 'item-2' });

            await vi.waitFor(() => {
                // Should cleanup old session and register new one
                expect(fetchMock).toHaveBeenCalledWith(
                    `/api/sessions?deviceId=${mockDeviceId}&itemId=item-1`,
                    { method: 'DELETE', keepalive: true }
                );
            });

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: mockDeviceId,
                        itemId: 'item-2'
                    })
                });
            });
        });

        it('should cleanup when itemId becomes null', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            const { rerender } = renderHook(
                ({ itemId }) => useActiveSession(itemId),
                { initialProps: { itemId: 'item-1' } }
            );

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            // Set itemId to null
            rerender({ itemId: null });

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith(
                    `/api/sessions?deviceId=${mockDeviceId}&itemId=item-1`,
                    { method: 'DELETE', keepalive: true }
                );
            });
        });
    });
});
