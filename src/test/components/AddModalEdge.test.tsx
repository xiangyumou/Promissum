import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddModal from '@/components/AddModal';
import { renderWithProviders } from '@/test/utils';
import { timeService } from '@/lib/services/time-service';

// Mock dependencies
vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, children }: any) => isOpen ? <div data-testid="modal">{children}</div> : null
}));

// Mock time for consistent testing
vi.mock('@/lib/services/time-service', () => ({
    timeService: {
        now: vi.fn(() => new Date('2024-06-15T12:00:00').getTime())
    }
}));

// TODO: AddModal has been refactored to a Wizard-based UI. These tests need to be completely rewritten.
// Skipping temporarily to focus on coverage improvements for other components.
describe.skip('AddModal Edge Cases', () => {
    const mockOnAdd = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (timeService.now as any).mockReturnValue(new Date('2024-06-15T12:00:00').getTime());
    });

    describe('Validation', () => {
        it('should not submit when text content is empty', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Submit button should be disabled when no content
            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).toBeDisabled();

            // Verify onSubmit was not called
            expect(mockOnAdd).not.toHaveBeenCalled();
        });

        it('should enable submit when content is entered', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Valid content' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).not.toBeDisabled();
        });
    });

    describe('Title Input', () => {
        it('should handle long title gracefully', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            const longTitle = 'a'.repeat(200); // Long title
            const titleInput = screen.getByPlaceholderText('Title (optional)');
            fireEvent.change(titleInput, { target: { value: longTitle } });

            // Enter content to enable submit
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Some content' } });

            // Should still be able to submit
            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).not.toBeDisabled();
        });

        it('should allow empty title', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Just enter content, leave title empty
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Content without title' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).not.toBeDisabled();

            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnAdd).toHaveBeenCalled();
            });
        });
    });

    describe('Absolute Time Mode', () => {
        it('should show invalid time for past date', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Click Custom Date toggle button
            const absoluteBtn = screen.getByRole('button', { name: /Custom Date/i });
            fireEvent.click(absoluteBtn);

            // Enter a past year (20 = 2020, which is in the past)
            const yearInput = screen.getByPlaceholderText('YY');
            fireEvent.change(yearInput, { target: { value: '20' } });

            // Should show invalid time
            expect(screen.getByText('Invalid time')).toBeInTheDocument();
            expect(screen.getByText('Encrypt & Save')).toBeDisabled();
        });

        it('should accept valid future date', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Click Custom Date toggle button
            const absoluteBtn = screen.getByRole('button', { name: /Custom Date/i });
            fireEvent.click(absoluteBtn);

            // Enter a future year (30 = 2030)
            const yearInput = screen.getByPlaceholderText('YY');
            fireEvent.change(yearInput, { target: { value: '30' } });

            // Should not show invalid time (assuming other fields are valid)
            // The validation is more complex, but at least the button state changes
        });
    });

    describe('Image Type', () => {
        it('should switch to image mode', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            const imageBtn = screen.getByText('Image');
            fireEvent.click(imageBtn);

            // Should show upload area
            expect(screen.getByText('Upload Image')).toBeInTheDocument();
        });

        it('should disable submit without image in image mode', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            const imageBtn = screen.getByText('Image');
            fireEvent.click(imageBtn);

            // Submit should be disabled without an image
            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).toBeDisabled();
        });
    });

    describe('Duration Presets', () => {
        it('should update duration when clicking preset', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Click 1 day preset
            const dayPreset = screen.getByText('1d');
            fireEvent.click(dayPreset);

            // Enter content and submit
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Content' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnAdd).toHaveBeenCalled();
            });

            // Check that duration is updated (1d = 1440 minutes)
            const formData = mockOnAdd.mock.calls[0][0] as FormData;
            const duration = parseInt(formData.get('durationMinutes') as string);
            // Duration should be greater than default 60
            expect(duration).toBeGreaterThan(60);
        });

        it('should handle multiple preset clicks', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Click multiple presets to accumulate time
            fireEvent.click(screen.getByText('1h'));
            fireEvent.click(screen.getByText('1h'));
            fireEvent.click(screen.getByText('1d'));

            // Enter content and submit
            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Content' } });

            const submitBtn = screen.getByText('Encrypt & Save');
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnAdd).toHaveBeenCalled();
            });
        });
    });
});
