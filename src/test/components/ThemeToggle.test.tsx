import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeToggle from '@/components/ThemeToggle';
import { renderWithProviders } from '@/test/utils';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'system',
        setTheme: mockSetTheme
    })
}));

describe('ThemeToggle', () => {
    it('should render theme options', () => {
        renderWithProviders(<ThemeToggle />);
        expect(screen.getByTitle('Light')).toBeInTheDocument();
        expect(screen.getByTitle('Dark')).toBeInTheDocument();
        expect(screen.getByTitle('System')).toBeInTheDocument();
    });

    it('should switch to light theme', () => {
        renderWithProviders(<ThemeToggle />);
        fireEvent.click(screen.getByTitle('Light'));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should switch to dark theme', () => {
        renderWithProviders(<ThemeToggle />);
        fireEvent.click(screen.getByTitle('Dark'));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
});
