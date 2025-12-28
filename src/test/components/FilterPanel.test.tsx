import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from '@/components/FilterPanel';
import { renderWithProviders } from '@/test/utils';

describe('FilterPanel', () => {
    const mockOnFilterChange = vi.fn();
    const defaultFilters = {
        status: 'all' as const,
        sort: 'created_desc' as const
    };

    it('should render collapsed by default', () => {
        renderWithProviders(
            <FilterPanel
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );
        // The content is hidden when collapsed (using AnimatePresence/unmount)
        // Adjust expectation based on implementation (AnimatePresence usually unmounts)
        expect(screen.queryByLabelText('search')).not.toBeInTheDocument();
    });

    it('should expand and show filters', () => {
        renderWithProviders(
            <FilterPanel
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );

        const toggleBtn = screen.getByTitle('Filters');
        fireEvent.click(toggleBtn);

        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should call onFilterChange when status changed', () => {
        renderWithProviders(
            <FilterPanel
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );

        fireEvent.click(screen.getByTitle('Filters')); // Expand

        const lockedBtn = screen.getByText('Locked').closest('button');
        fireEvent.click(lockedBtn!);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            status: 'locked'
        });
    });

    it('should call onFilterChange when search input changed', () => {
        renderWithProviders(
            <FilterPanel
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );

        fireEvent.click(screen.getByTitle('Filters')); // Expand

        const searchInput = screen.getByPlaceholderText('Search...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            search: 'test'
        });
    });
});
