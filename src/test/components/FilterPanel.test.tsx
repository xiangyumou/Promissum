import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterPanel from '@/components/FilterPanel';
import { renderWithProviders } from '@/test/utils';
import { FilterParams } from '@/lib/api-client';

describe('FilterPanel', () => {
    const mockOnFilterChange = vi.fn();
    const defaultFilters: FilterParams = {
        status: 'all',
        sort: 'created_desc'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderExpanded = (filters = defaultFilters) => {
        const result = renderWithProviders(
            <FilterPanel
                filters={filters}
                onFilterChange={mockOnFilterChange}
            />
        );
        fireEvent.click(screen.getByTitle(/filters/i));
        return result;
    };

    it('should render collapsed by default', () => {
        renderWithProviders(
            <FilterPanel
                filters={defaultFilters}
                onFilterChange={mockOnFilterChange}
            />
        );
        expect(screen.queryByPlaceholderText(/search.../i)).not.toBeInTheDocument();
    });

    it('should show active indicator when filters are active', () => {
        renderWithProviders(
            <FilterPanel
                filters={{ ...defaultFilters, search: 'test' }}
                onFilterChange={mockOnFilterChange}
            />
        );
        // The dot indicator
        const trigger = screen.getByTitle(/filters/i);
        expect(trigger.className).toContain('bg-primary/20');
    });

    it('should call onFilterChange when status changed', () => {
        renderExpanded();

        fireEvent.click(screen.getByText('Locked').closest('button')!);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            status: 'locked'
        });
    });

    it('should call onFilterChange when type changed', () => {
        renderExpanded();

        fireEvent.click(screen.getByText('Text Note').closest('button')!);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            type: 'text'
        });
    });

    it('should call onFilterChange when sort changed', () => {
        renderExpanded();

        // Matches "Oldest" from mock translation
        fireEvent.click(screen.getByText(/oldest/i).closest('button')!);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            sort: 'created_asc'
        });
    });

    it('should handle search input change', () => {
        renderExpanded();

        const input = screen.getByPlaceholderText(/search.../i);
        fireEvent.change(input, { target: { value: 'query' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            search: 'query'
        });
    });

    it('should clear search when X clicked', () => {
        renderExpanded({ ...defaultFilters, search: 'hello' });

        const clearBtn = screen.getByTitle(/clear search/i);
        fireEvent.click(clearBtn);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            search: ''
        });
    });

    it('should clear status when X clicked', () => {
        renderExpanded({ ...defaultFilters, status: 'locked' });

        const clearBtn = screen.getByTitle(/clear status/i);
        fireEvent.click(clearBtn);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            status: 'all'
        });
    });

    it('should clear type when X clicked', () => {
        renderExpanded({ ...defaultFilters, type: 'text' });

        const clearBtn = screen.getByTitle(/clear type/i);
        fireEvent.click(clearBtn);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            type: undefined
        });
    });

    it('should reset all filters', () => {
        renderExpanded({
            status: 'locked',
            search: 'foo',
            type: 'image',
            sort: 'decrypt_asc'
        });

        const resetBtn = screen.getByTitle(/reset filters/i);
        fireEvent.click(resetBtn);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            status: 'all',
            sort: 'decrypt_asc',
        });
    });
});
