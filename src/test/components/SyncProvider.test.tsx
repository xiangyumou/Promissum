import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SyncProvider } from '@/components/SyncProvider';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { sseClient } from '@/lib/sse-client';
import { migrateLocalStorage } from '@/lib/migrate-localstorage';
import { useSettings } from '@/lib/stores/settings-store';
import { getDeviceId } from '@/lib/device-id';

// Mock dependencies
vi.mock('@/lib/sse-client', () => ({
    sseClient: {
        connect: vi.fn(),
        disconnect: vi.fn()
    }
}));

vi.mock('@/lib/migrate-localstorage', () => ({
    migrateLocalStorage: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@/lib/device-id', () => ({
    getDeviceId: vi.fn().mockResolvedValue('test-device-id')
}));

vi.mock('@/lib/stores/settings-store', async () => {
    const actual = await vi.importActual('@/lib/stores/settings-store');
    return {
        ...actual,
        useSettings: vi.fn()
    };
});

describe('SyncProvider', () => {
    let queryClient: QueryClient;
    let mockSettings: any;
    let fetchMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup fetch mock
        fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });
        global.fetch = fetchMock as any;

        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        });

        mockSettings = {
            defaultDurationMinutes: 60,
            privacyMode: false,
            panicUrl: '',
            themeConfig: {},
            dateTimeFormat: 'relative',
            compactMode: false,
            sidebarOpen: false,
            confirmDelete: true,
            confirmExtend: true,
            autoRefreshInterval: 30,
            cacheTTLMinutes: 5,
            autoPrivacyDelayMinutes: 0,
            panicShortcut: '',
            apiToken: '',
            apiUrl: ''
        };

        (useSettings as any).mockReturnValue(mockSettings);
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    // Helper to render SyncProvider with QueryClient
    const renderSyncProvider = (children: React.ReactNode) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <SyncProvider>{children}</SyncProvider>
            </QueryClientProvider>
        );
    };

    describe('SSE Connection Management', () => {
        it('should connect to SSE on mount', () => {
            renderSyncProvider(<div>Child Content</div>);

            expect(sseClient.connect).toHaveBeenCalledWith(queryClient);
        });

        it('should disconnect from SSE on unmount', () => {
            const { unmount } = renderSyncProvider(<div>Child Content</div>);

            unmount();

            expect(sseClient.disconnect).toHaveBeenCalled();
        });

        it('should handle SSE connection errors gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (migrateLocalStorage as any).mockRejectedValueOnce(new Error('Migration failed'));

            renderSyncProvider(<div>Child Content</div>);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('LocalStorage Migration', () => {
        it('should execute migration on mount', () => {
            renderSyncProvider(<div>Child Content</div>);

            expect(migrateLocalStorage).toHaveBeenCalled();
        });

        it('should handle migration errors without crashing', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const error = new Error('Migration error');
            (migrateLocalStorage as any).mockRejectedValueOnce(error);

            const { container } = renderSyncProvider(<div>Child Content</div>);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(error);
            });

            // Component should still render children
            expect(container.textContent).toContain('Child Content');

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Settings Sync', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should skip sync on initial mount', async () => {
            renderSyncProvider(<div>Child Content</div>);

            // Advance timers past debounce
            vi.advanceTimersByTime(1500);

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should sync settings to API after debounce when settings change', async () => {
            const { rerender } = renderSyncProvider(<div>Child Content</div>);

            // Simulate settings change
            const updatedSettings = {
                ...mockSettings,
                privacyMode: true
            };
            (useSettings as any).mockReturnValue(updatedSettings);

            rerender(
                <QueryClientProvider client={queryClient}>
                    <SyncProvider><div>Child Content</div></SyncProvider>
                </QueryClientProvider>
            );

            // Advance past debounce (1 second)
            await vi.advanceTimersByTimeAsync(1100);

            expect(fetchMock).toHaveBeenCalledWith(
                '/api/preferences',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        it('should include all settings fields in sync payload', async () => {
            const { rerender } = renderSyncProvider(<div>Child Content</div>);

            // Change a setting
            const updatedSettings = {
                ...mockSettings,
                defaultDurationMinutes: 120
            };
            (useSettings as any).mockReturnValue(updatedSettings);

            rerender(
                <QueryClientProvider client={queryClient}>
                    <SyncProvider><div>Child Content</div></SyncProvider>
                </QueryClientProvider>
            );

            await vi.advanceTimersByTimeAsync(1100);

            const fetchCall = fetchMock.mock.calls[0];
            const payload = JSON.parse(fetchCall[1].body);

            expect(payload).toEqual(
                expect.objectContaining({
                    deviceId: 'test-device-id',
                    defaultDurationMinutes: 120,
                    privacyMode: false,
                    themeConfig: '{}',
                    confirmDelete: true,
                    confirmExtend: true
                })
            );
        });

        it('should debounce multiple rapid setting changes', async () => {
            const { rerender } = renderSyncProvider(<div>Child Content</div>);

            // Multiple rapid changes
            for (let i = 0; i < 5; i++) {
                const updatedSettings = {
                    ...mockSettings,
                    defaultDurationMinutes: 60 + i
                };
                (useSettings as any).mockReturnValue(updatedSettings);

                rerender(
                    <QueryClientProvider client={queryClient}>
                        <SyncProvider><div>Child Content</div></SyncProvider>
                    </QueryClientProvider>
                );
                vi.advanceTimersByTime(200); // Less than debounce time
            }

            // Only one API call should be made after final debounce
            await vi.advanceTimersByTimeAsync(1100);

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('should handle sync API failures gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            const { rerender } = renderSyncProvider(<div>Child Content</div>);

            const updatedSettings = {
                ...mockSettings,
                privacyMode: true
            };
            (useSettings as any).mockReturnValue(updatedSettings);

            rerender(
                <QueryClientProvider client={queryClient}>
                    <SyncProvider><div>Child Content</div></SyncProvider>
                </QueryClientProvider>
            );

            await vi.advanceTimersByTimeAsync(1100);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to sync settings:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should clear timeout on unmount', async () => {
            const { rerender, unmount } = renderSyncProvider(<div>Child Content</div>);

            // Trigger a settings change
            const updatedSettings = {
                ...mockSettings,
                privacyMode: true
            };
            (useSettings as any).mockReturnValue(updatedSettings);

            rerender(
                <QueryClientProvider client={queryClient}>
                    <SyncProvider><div>Child Content</div></SyncProvider>
                </QueryClientProvider>
            );

            // Unmount before debounce completes
            vi.advanceTimersByTime(500);
            unmount();

            // Complete the debounce time
            vi.advanceTimersByTime(1000);

            // API should not be called since component unmounted
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe('Children Rendering', () => {
        it('should render children correctly', () => {
            const { container } = renderSyncProvider(
                <div data-testid="child">Test Child</div>
            );

            expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
            expect(container.textContent).toContain('Test Child');
        });

        it('should render multiple children', () => {
            const { container } = renderSyncProvider(
                <>
                    <div>Child 1</div>
                    <div>Child 2</div>
                    <div>Child 3</div>
                </>
            );

            expect(container.textContent).toContain('Child 1');
            expect(container.textContent).toContain('Child 2');
            expect(container.textContent).toContain('Child 3');
        });
    });
});
