import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
});
