import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
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
            setPrivacyMode: mockSetPrivacyMode
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

    describe('Render Behavior', () => {
        it('should render nothing (return null)', () => {
            const { container } = render(<SecurityProvider />);
            expect(container.firstChild).toBeNull();
        });
    });
});
