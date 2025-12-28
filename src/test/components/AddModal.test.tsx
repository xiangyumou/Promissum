import { fireEvent, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddModal from '@/components/AddModal';
import { renderWithProviders } from '@/test/utils';
import { timeService } from '@/lib/services/time-service';

// Mock Modal explicitly to keep test focused on content
vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, children, title }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal">
                <h1>{title}</h1>
                {children}
            </div>
        );
    }
}));

describe('AddModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock time to fixed date for predictable tests
        vi.spyOn(timeService, 'now').mockReturnValue(new Date('2023-01-01T12:00:00').getTime());
    });

    describe('Rendering', () => {
        it('should return null if not open', () => {
            renderWithProviders(
                <AddModal
                    isOpen={false}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );
            expect(screen.queryByTestId('modal')).toBeNull();
        });

        it('should render form when open', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );
            expect(screen.getByTestId('modal')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Title (optional)')).toBeInTheDocument();
        });

        it('should render content textarea', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );
            expect(screen.getByPlaceholderText('Write your thought...')).toBeInTheDocument();
        });

        it('should render type toggle buttons', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );
            // Check for Text Note and Image buttons by role
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    describe('Text Item Submission', () => {
        it('should submit text item with content', async () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Enter content
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'My secret message' } });

            // Click submit button
            const submitBtn = screen.getByText('Encrypt & Save');
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            });

            // Verify FormData was passed
            const formData = mockOnSubmit.mock.calls[0][0];
            expect(formData).toBeInstanceOf(FormData);
            expect(formData.get('type')).toBe('text');
            expect(formData.get('content')).toBe('My secret message');
            expect(formData.get('durationMinutes')).toBe('60');
        });

        it('should include title in FormData when provided', async () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Enter title
            const titleInput = screen.getByPlaceholderText('Title (optional)');
            fireEvent.change(titleInput, { target: { value: 'My Title' } });

            // Enter content
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Content here' } });

            // Submit
            const submitBtn = screen.getByText('Encrypt & Save');
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
            });

            const formData = mockOnSubmit.mock.calls[0][0];
            // Title should be in metadata
            const metadata = formData.get('metadata');
            expect(metadata).toContain('My Title');
        });

        it('should call onClose after successful submission', async () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Content' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });

    describe('Duration Presets', () => {
        it('should update duration when preset clicked', async () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Click 1 day preset
            const dayPreset = screen.getByText('1d');
            fireEvent.click(dayPreset);

            // Submit and check duration
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Content' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
            });

            const formData = mockOnSubmit.mock.calls[0][0];
            // The component adds the preset to the current duration
            // Verify duration was changed from default
            const duration = parseInt(formData.get('durationMinutes'));
            expect(duration).toBeGreaterThan(60); // More than default
        });
    });

    describe('Image Type', () => {
        it('should switch to image mode when image button clicked', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const imageBtn = screen.getByText('Image');
            fireEvent.click(imageBtn);

            // Should show upload area
            expect(screen.getByText('Upload Image')).toBeInTheDocument();
        });
    });

    describe('Time Mode', () => {
        it('should switch to absolute time mode', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const customDateBtn = screen.getByText('Custom Date');
            fireEvent.click(customDateBtn);

            // Should show year input
            expect(screen.getByPlaceholderText('YY')).toBeInTheDocument();
        });
    });

    describe('Validation', () => {
        it('should disable submit when content is empty', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).toBeDisabled();
        });

        it('should enable submit when content is entered', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Some content' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).not.toBeDisabled();
        });
    });
});

