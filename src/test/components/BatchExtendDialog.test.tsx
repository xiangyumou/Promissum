import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchExtendDialog from '@/components/BatchExtendDialog';
import { renderWithProviders } from '../utils';

describe('BatchExtendDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render when open', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        expect(screen.getByText('Batch Extend')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={false}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        expect(screen.queryByText('Batch Extend')).not.toBeInTheDocument();
    });

    it('should have default duration of 60 minutes', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        const input = screen.getByDisplayValue('60');
        expect(input).toBeInTheDocument();
    });

    it('should add preset duration when preset button clicked', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        // Click +10m preset
        const preset10m = screen.getByText('10m');
        fireEvent.click(preset10m);

        // Duration should increase from 60 to 70
        expect(screen.getByDisplayValue('70')).toBeInTheDocument();
    });

    it('should reset duration to 60 when reset button clicked', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        // Change duration
        const input = screen.getByDisplayValue('60') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '120' } });
        expect(screen.getByDisplayValue('120')).toBeInTheDocument();

        // Click reset
        const resetButton = screen.getByText(/reset/i);
        fireEvent.click(resetButton);

        // Should be back to 60
        expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });

    it('should allow custom duration input', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        const input = screen.getByDisplayValue('60') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '240' } });

        expect(screen.getByDisplayValue('240')).toBeInTheDocument();
    });

    it('should call onConfirm with correct duration when submitted', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        // Change duration to 120
        const input = screen.getByDisplayValue('60') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '120' } });

        // Click confirm button
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledWith(120);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button clicked', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should disable submit button when duration is 0', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        const input = screen.getByDisplayValue('60') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '0' } });

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).toBeDisabled();
    });

    it('should prevent negative durations', () => {
        renderWithProviders(
            <BatchExtendDialog
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                itemCount={3}
            />
        );

        const input = screen.getByDisplayValue('60') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '-10' } });

        // Should set to 0 (handled by Math.max(0, ...)), which renders as empty string
        expect(input).toHaveValue(null);
    });
});
