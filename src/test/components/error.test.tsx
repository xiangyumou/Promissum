import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Error from '@/app/[locale]/error';

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            title: 'Something went wrong',
            description: 'An error occurred while loading this page',
            retry: 'Try again'
        };
        return translations[key] || key;
    }
}));

describe('Error Boundary Component', () => {
    const mockReset = vi.fn();
    const mockError = new Error('Test error message');

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock console.error to avoid noise in test output
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('should render error UI with title and description', () => {
            render(<Error error={mockError} reset={mockReset} />);

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('An error occurred while loading this page')).toBeInTheDocument();
        });

        it('should display retry button', () => {
            render(<Error error={mockError} reset={mockReset} />);

            const retryButton = screen.getByRole('button', { name: /try again/i });
            expect(retryButton).toBeInTheDocument();
        });

        it('should display error digest when provided', () => {
            const errorWithDigest = Object.assign(mockError, { digest: 'abc123' });

            render(<Error error={errorWithDigest} reset={mockReset} />);

            expect(screen.getByText(/Error ID: abc123/i)).toBeInTheDocument();
        });

        it('should not display error digest when not provided', () => {
            render(<Error error={mockError} reset={mockReset} />);

            expect(screen.queryByText(/Error ID:/i)).not.toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('should call reset function when retry button is clicked', async () => {
            const user = userEvent.setup();
            render(<Error error={mockError} reset={mockReset} />);

            const retryButton = screen.getByRole('button', { name: /try again/i });
            await user.click(retryButton);

            expect(mockReset).toHaveBeenCalledTimes(1);
        });

        it('should allow multiple retry attempts', async () => {
            const user = userEvent.setup();
            render(<Error error={mockError} reset={mockReset} />);

            const retryButton = screen.getByRole('button', { name: /try again/i });

            await user.click(retryButton);
            await user.click(retryButton);
            await user.click(retryButton);

            expect(mockReset).toHaveBeenCalledTimes(3);
        });
    });

    describe('Error Logging', () => {
        it('should log error to console on mount', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error');

            render(<Error error={mockError} reset={mockReset} />);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', mockError);
        });

        it('should log error with digest if available', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error');
            const errorWithDigest = Object.assign(new Error('Test'), { digest: 'xyz789' });

            render(<Error error={errorWithDigest} reset={mockReset} />);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', errorWithDigest);
        });
    });

    describe('UI Elements', () => {
        it('should render error icon', () => {
            const { container } = render(<Error error={mockError} reset={mockReset} />);

            // Check for SVG icon
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should have proper styling classes', () => {
            const { container } = render(<Error error={mockError} reset={mockReset} />);

            // Verify main container has expected classes
            const mainContainer = container.querySelector('.h-screen');
            expect(mainContainer).toBeInTheDocument();
        });
    });
});
