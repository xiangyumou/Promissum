import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import SecurityProvider from '@/components/SecurityProvider';
import * as settingsStore from '@/lib/stores/settings-store';

// Mock the settings store
vi.mock('@/lib/stores/settings-store', () => ({
    useSettings: vi.fn()
}));

describe('SecurityProvider', () => {
    let mockSettings: any;
    let mockSetPrivacyMode: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();

        mockSetPrivacyMode = vi.fn();
        mockSettings = {
            autoPrivacyDelayMinutes: 5,
            privacyMode: false,
            setPrivacyMode: mockSetPrivacyMode,
            panicShortcut: 'alt+p',
            panicUrl: 'https://google.com'
        };

        (settingsStore.useSettings as any).mockReturnValue(mockSettings);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Auto Privacy Mode', () => {
        it('should trigger privacy mode after inactivity timeout', () => {
            render(<SecurityProvider />);

            // Fast-forward past the auto-privacy delay (5 minutes = 300000ms)
            act(() => {
                vi.advanceTimersByTime(5 * 60 * 1000 + 100);
            });

            expect(mockSetPrivacyMode).toHaveBeenCalledWith(true);
        });

        it('should not trigger privacy mode before timeout', () => {
            render(<SecurityProvider />);

            // Fast-forward but not past the delay
            act(() => {
                vi.advanceTimersByTime(4 * 60 * 1000);
            });

            expect(mockSetPrivacyMode).not.toHaveBeenCalled();
        });

        it('should reset timer on user activity', () => {
            render(<SecurityProvider />);

            // Wait 4 minutes
            act(() => {
                vi.advanceTimersByTime(4 * 60 * 1000);
            });

            // Simulate user activity
            act(() => {
                window.dispatchEvent(new MouseEvent('mousedown'));
            });

            // Wait another 4 minutes (should not trigger because timer was reset)
            act(() => {
                vi.advanceTimersByTime(4 * 60 * 1000);
            });

            expect(mockSetPrivacyMode).not.toHaveBeenCalled();

            // Wait 1 more minute to complete the 5 minute timeout from last activity
            act(() => {
                vi.advanceTimersByTime(1 * 60 * 1000 + 100);
            });

            expect(mockSetPrivacyMode).toHaveBeenCalledWith(true);
        });

        it('should not trigger if already in privacy mode', () => {
            mockSettings.privacyMode = true;
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                vi.advanceTimersByTime(10 * 60 * 1000);
            });

            expect(mockSetPrivacyMode).not.toHaveBeenCalled();
        });

        it('should not trigger if autoPrivacyDelayMinutes is 0 (disabled)', () => {
            mockSettings.autoPrivacyDelayMinutes = 0;
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                vi.advanceTimersByTime(10 * 60 * 1000);
            });

            expect(mockSetPrivacyMode).not.toHaveBeenCalled();
        });

        it('should respond to multiple activity types', () => {
            render(<SecurityProvider />);

            // Various activity events
            const events = ['mousedown', 'mousemove', 'scroll', 'touchstart'];

            events.forEach((eventType) => {
                // Advance 4 minutes
                act(() => {
                    vi.advanceTimersByTime(4 * 60 * 1000);
                });

                // Dispatch activity event
                act(() => {
                    window.dispatchEvent(new Event(eventType));
                });
            });

            // Should still not have triggered privacy mode
            expect(mockSetPrivacyMode).not.toHaveBeenCalled();
        });
    });

    describe('Panic Shortcut', () => {
        let originalLocation: Location;

        beforeEach(() => {
            // Mock window.location
            originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { href: '' },
                writable: true
            });
        });

        afterEach(() => {
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true
            });
        });

        it('should redirect to panic URL when shortcut pressed', () => {
            render(<SecurityProvider />);

            // Simulate alt+p
            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'p',
                    altKey: true,
                    ctrlKey: false,
                    shiftKey: false,
                    metaKey: false
                }));
            });

            expect(window.location.href).toBe('https://google.com');
        });

        it('should not redirect when wrong key is pressed', () => {
            render(<SecurityProvider />);

            // Simulate alt+x (wrong key)
            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'x',
                    altKey: true
                }));
            });

            expect(window.location.href).toBe('');
        });

        it('should not redirect when wrong modifier is used', () => {
            render(<SecurityProvider />);

            // Simulate ctrl+p instead of alt+p
            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'p',
                    altKey: false,
                    ctrlKey: true
                }));
            });

            expect(window.location.href).toBe('');
        });

        it('should handle ctrl+shift+x shortcut', () => {
            mockSettings.panicShortcut = 'ctrl+shift+x';
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'x',
                    ctrlKey: true,
                    shiftKey: true,
                    altKey: false,
                    metaKey: false
                }));
            });

            expect(window.location.href).toBe('https://google.com');
        });

        it('should handle meta+p (Mac command) shortcut', () => {
            mockSettings.panicShortcut = 'meta+p';
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'p',
                    metaKey: true,
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false
                }));
            });

            expect(window.location.href).toBe('https://google.com');
        });

        it('should handle cmd+p as alias for meta', () => {
            mockSettings.panicShortcut = 'cmd+p';
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'p',
                    metaKey: true
                }));
            });

            expect(window.location.href).toBe('https://google.com');
        });

        it('should not trigger if panicShortcut is empty', () => {
            mockSettings.panicShortcut = '';
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'p',
                    altKey: true
                }));
            });

            expect(window.location.href).toBe('');
        });

        it('should not trigger if panicUrl is empty', () => {
            mockSettings.panicUrl = '';
            (settingsStore.useSettings as any).mockReturnValue(mockSettings);

            render(<SecurityProvider />);

            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'p',
                    altKey: true
                }));
            });

            expect(window.location.href).toBe('');
        });
    });

    describe('Render Behavior', () => {
        it('should render nothing (return null)', () => {
            const { container } = render(<SecurityProvider />);
            expect(container.firstChild).toBeNull();
        });
    });
});
