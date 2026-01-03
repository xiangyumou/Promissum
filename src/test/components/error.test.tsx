import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            title: 'Something went wrong',
            description: 'An unexpected error occurred. Please try again.',
            retry: 'Try Again'
        };
        return translations[key] || key;
    }
}));

// Import the component after mocking - use alias to avoid naming conflict
import ErrorComponent from '@/app/[locale]/error';

interface TestError extends Error {
    digest?: string;
}

describe('Error Boundary Component', () => {
    const mockReset = vi.fn();

    const createTestError = (message: string, digest?: string): TestError => {
        const error = new globalThis.Error(message) as TestError;
        if (digest) {
            error.digest = digest;
        }
        return error;
    };

    const defaultError = createTestError('Test error message');

    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console.error in tests since the component logs errors
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('Rendering', () => {
        it('should render error title and description', () => {
            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
        });

        it('should render retry button', () => {
            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            const retryButton = screen.getByRole('button', { name: 'Try Again' });
            expect(retryButton).toBeInTheDocument();
        });

        it('should render error icon', () => {
            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            // Check for SVG element (warning icon)
            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('Error Digest Display', () => {
        it('should display error digest when present', () => {
            const errorWithDigest = createTestError('Test error', 'abc123');

            render(<ErrorComponent error={errorWithDigest} reset={mockReset} />);

            expect(screen.getByText(/Error ID: abc123/)).toBeInTheDocument();
        });

        it('should not display error digest section when digest is undefined', () => {
            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should call reset when retry button is clicked', async () => {
            const user = userEvent.setup();
            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            const retryButton = screen.getByRole('button', { name: 'Try Again' });
            await user.click(retryButton);

            expect(mockReset).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Logging', () => {
        it('should log error to console on mount', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', defaultError);
        });
    });

    describe('Accessibility', () => {
        it('should have proper semantic structure', () => {
            render(<ErrorComponent error={defaultError} reset={mockReset} />);

            // Should have heading
            expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
            // Should have button
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });
});
