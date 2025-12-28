import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PresetSaveDialog from '@/components/PresetSaveDialog';
import { renderWithProviders } from '@/test/utils';

describe('PresetSaveDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        onConfirm: mockOnConfirm
    };

    it('should not render when isOpen is false', () => {
        renderWithProviders(
            <PresetSaveDialog {...defaultProps} isOpen={false} />
        );
        expect(screen.queryByText('Save Preset')).not.toBeInTheDocument();
    });

    it('should render correctly when open', () => {
        renderWithProviders(<PresetSaveDialog {...defaultProps} />);

        expect(screen.getByText('Save Preset')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. My Favorite Filter')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled(); // Initially disabled because name is empty
    });

    it('should handle input change and enable save button', () => {
        renderWithProviders(<PresetSaveDialog {...defaultProps} />);

        const input = screen.getByPlaceholderText('e.g. My Favorite Filter');
        fireEvent.change(input, { target: { value: 'My Preset' } });

        expect(input).toHaveValue('My Preset');
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    });

    it('should call onConfirm with name when form submitted', () => {
        renderWithProviders(<PresetSaveDialog {...defaultProps} />);

        const input = screen.getByPlaceholderText('e.g. My Favorite Filter');
        fireEvent.change(input, { target: { value: 'My Preset' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(mockOnConfirm).toHaveBeenCalledWith('My Preset');
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should trim name before submitting', () => {
        renderWithProviders(<PresetSaveDialog {...defaultProps} />);

        const input = screen.getByPlaceholderText('e.g. My Favorite Filter');
        fireEvent.change(input, { target: { value: '  My Preset  ' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(mockOnConfirm).toHaveBeenCalledWith('My Preset');
    });

    it('should call onClose when cancel clicked', () => {
        renderWithProviders(<PresetSaveDialog {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mockOnClose).toHaveBeenCalled();
    });
});
