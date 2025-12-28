import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiStatusIndicator from '@/components/ApiStatusIndicator';
import { renderWithProviders } from '@/test/utils';
import * as useApiHealthModule from '@/lib/use-api-health';

// Mock the useApiHealth hook
vi.mock('@/lib/use-api-health', () => ({
    useApiHealth: vi.fn()
}));

// Add ApiStatus messages to test utils
const apiStatusMessages = {
    ApiStatus: {
        checking: 'Checking...',
        connected: 'Connected',
        disconnected: 'Disconnected',
        offline: 'Offline'
    }
};

// Extend renderWithProviders for this test
vi.mock('next-intl', async () => {
    const actual = await vi.importActual('next-intl');
    return {
        ...actual,
        useTranslations: () => (key: string) => {
            const translations: Record<string, string> = {
                checking: 'Checking...',
                connected: 'Connected',
                disconnected: 'Disconnected',
                offline: 'Offline'
            };
            return translations[key] || key;
        }
    };
});

describe('ApiStatusIndicator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Loading State', () => {
        it('should show loading spinner and text when checking', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: true,
                isError: false,
                data: undefined
            });

            renderWithProviders(<ApiStatusIndicator />);

            expect(screen.getByText('Checking...')).toBeInTheDocument();
        });
    });

    describe('Connected State', () => {
        it('should show connected status when API is healthy', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: false,
                data: { status: 'ok' }
            });

            renderWithProviders(<ApiStatusIndicator />);

            // Check for connected text (visible on larger screens)
            const container = document.querySelector('[title="Connected"]');
            expect(container).toBeInTheDocument();
        });

        it('should display green styling for connected state', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: false,
                data: { status: 'ok' }
            });

            const { container } = renderWithProviders(<ApiStatusIndicator />);

            // Check for emerald color classes
            const statusDiv = container.firstChild as HTMLElement;
            expect(statusDiv.className).toContain('text-emerald-500');
        });
    });

    describe('Disconnected State', () => {
        it('should show disconnected status when API returns error', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: true,
                data: undefined
            });

            renderWithProviders(<ApiStatusIndicator />);

            const container = document.querySelector('[title="Disconnected"]');
            expect(container).toBeInTheDocument();
        });

        it('should show disconnected when status is not ok', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: false,
                data: { status: 'error' }
            });

            renderWithProviders(<ApiStatusIndicator />);

            const container = document.querySelector('[title="Disconnected"]');
            expect(container).toBeInTheDocument();
        });

        it('should display red styling for disconnected state', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: true,
                data: undefined
            });

            const { container } = renderWithProviders(<ApiStatusIndicator />);

            const statusDiv = container.firstChild as HTMLElement;
            expect(statusDiv.className).toContain('text-red-500');
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined data gracefully', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: false,
                data: undefined
            });

            renderWithProviders(<ApiStatusIndicator />);

            // Should show disconnected when no data
            const container = document.querySelector('[title="Disconnected"]');
            expect(container).toBeInTheDocument();
        });

        it('should handle null status gracefully', () => {
            (useApiHealthModule.useApiHealth as any).mockReturnValue({
                isLoading: false,
                isError: false,
                data: { status: null }
            });

            renderWithProviders(<ApiStatusIndicator />);

            const container = document.querySelector('[title="Disconnected"]');
            expect(container).toBeInTheDocument();
        });
    });
});
