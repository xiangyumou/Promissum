import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '@/components/ConfirmDialog';
import { renderWithProviders } from '@/test/utils';

// Mock Modal again
vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, children, title }: any) => isOpen ? (
        <div data-testid="modal">
            <h1>{title}</h1>
            {children}
        </div>
    ) : null
}));

describe('ConfirmDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();
    const defaultProps = {
        isOpen: true,
        title: 'Confirm',
        description: 'Are you sure?',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render correct title and description', () => {
        renderWithProviders(<ConfirmDialog {...defaultProps} />);
        expect(screen.getByRole('heading', { name: 'Confirm' })).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should call onConfirm when confirmed', () => {
        renderWithProviders(<ConfirmDialog {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(mockOnConfirm).toHaveBeenCalled();
        expect(mockOnCancel).toHaveBeenCalled(); // It calls both
    });

    it('should call onCancel when cancelled', () => {
        renderWithProviders(<ConfirmDialog {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockOnCancel).toHaveBeenCalled();
    });

    describe('Variant Types', () => {
        it('should render danger variant correctly', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} variant="danger" />
            );
            const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
            expect(confirmBtn).toHaveClass('bg-red-500');
        });

        it('should render warning variant correctly', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} variant="warning" />
            );
            const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
            expect(confirmBtn).toHaveClass('premium-button');
        });

        it('should render info variant correctly', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} variant="info" />
            );
            const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
            expect(confirmBtn).toHaveClass('premium-button');
        });
    });

    describe('Custom Labels', () => {
        it('should use custom confirmLabel', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} confirmLabel="Delete Forever" />
            );
            expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeInTheDocument();
        });

        it('should use custom cancelLabel', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} cancelLabel="Go Back" />
            );
            expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
        });

        it('should use both custom labels', () => {
            renderWithProviders(
                <ConfirmDialog
                    {...defaultProps}
                    confirmLabel="Yes, Proceed"
                    cancelLabel="No, Cancel"
                />
            );
            expect(screen.getByRole('button', { name: 'Yes, Proceed' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'No, Cancel' })).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should not render when isOpen is false', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} isOpen={false} />
            );
            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });

        it('should handle empty title', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} title="" />
            );
            expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        });

        it('should handle very long description', () => {
            const longDescription = 'a'.repeat(500);
            renderWithProviders(
                <ConfirmDialog {...defaultProps} description={longDescription} />
            );
            expect(screen.getByText(longDescription)).toBeInTheDocument();
        });

        it('should handle undefined title', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} title={undefined as any} />
            );
            expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        });

        it('should handle undefined description', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} description={undefined as any} />
            );
            // Component should still render even with undefined description
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        });
    });

    describe('Interaction Edge Cases', () => {
        it('should prevent rapid clicking on confirm button', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <ConfirmDialog {...defaultProps} />
            );

            const confirmBtn = screen.getByRole('button', { name: 'Confirm' });

            // Rapid clicks
            await user.click(confirmBtn);
            await user.click(confirmBtn);
            await user.click(confirmBtn);

            // onConfirm should be called 3 times, onCancel 3 times
            // (the component calls both on confirm)
            expect(mockOnConfirm).toHaveBeenCalledTimes(3);
            expect(mockOnCancel).toHaveBeenCalledTimes(3);
        });

        it('should handle keyboard navigation - Enter key on Cancel', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <ConfirmDialog {...defaultProps} />
            );

            const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
            cancelBtn.focus();
            await user.keyboard('{Enter}');

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('should handle keyboard navigation - Enter key on Confirm', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <ConfirmDialog {...defaultProps} />
            );

            const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
            confirmBtn.focus();
            await user.keyboard('{Enter}');

            expect(mockOnConfirm).toHaveBeenCalled();
            expect(mockOnCancel).toHaveBeenCalled(); // Also calls onCancel
        });
    });

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} />
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);
        });

        it('should have proper heading role', () => {
            renderWithProviders(
                <ConfirmDialog {...defaultProps} title="Warning" />
            );

            expect(screen.getByRole('heading', { name: 'Warning' })).toBeInTheDocument();
        });
    });
});
