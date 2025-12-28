import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterBar from '@/components/FilterBar';
import { renderWithProviders } from '@/test/utils';

describe('FilterBar', () => {
    const mockOnFilterChange = vi.fn();
    const defaultFilters = {
        status: 'all' as const,
        sort: 'created_desc' as const
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the filter component', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            // Check basic structure is present
            expect(document.querySelector('input')).toBeInTheDocument();
        });

        it('should render status filter section', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            // Text "Status" appears in the component
            expect(screen.getByText('Status')).toBeInTheDocument();
        });

        it('should render type filter section', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            expect(screen.getByText('Type')).toBeInTheDocument();
        });
    });

    describe('Status Filter Interactions', () => {
        it('should call onFilterChange when locked status clicked', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            const lockedBtn = screen.getByText('Locked');
            fireEvent.click(lockedBtn);

            expect(mockOnFilterChange).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'locked' })
            );
        });

        it('should call onFilterChange when unlocked status clicked', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            const unlockedBtn = screen.getByText('Unlocked');
            fireEvent.click(unlockedBtn);

            expect(mockOnFilterChange).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'unlocked' })
            );
        });
    });

    describe('Type Filter Interactions', () => {
        it('should call onFilterChange when text type clicked', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            const textBtn = screen.getByText('Text Note');
            fireEvent.click(textBtn);

            expect(mockOnFilterChange).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'text' })
            );
        });

        it('should call onFilterChange when image type clicked', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            const imageBtn = screen.getByText('Image');
            fireEvent.click(imageBtn);

            expect(mockOnFilterChange).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'image' })
            );
        });
    });

    describe('Search Input', () => {
        it('should have search input', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            const input = screen.getByPlaceholderText('Search...');
            expect(input).toBeInTheDocument();
        });

        it('should call onFilterChange when typing in search', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            const input = screen.getByPlaceholderText('Search...');
            fireEvent.change(input, { target: { value: 'test' } });

            expect(mockOnFilterChange).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'test' })
            );
        });
    });

    describe('Clear Filters', () => {
        it('should show clear button when filters are active', () => {
            renderWithProviders(
                <FilterBar
                    filters={{ ...defaultFilters, status: 'locked' }}
                    onFilterChange={mockOnFilterChange}
                />
            );

            expect(screen.getByText('Clear Filters')).toBeInTheDocument();
        });

        it('should not show clear button when no filters active', () => {
            renderWithProviders(
                <FilterBar
                    filters={defaultFilters}
                    onFilterChange={mockOnFilterChange}
                />
            );

            expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
        });

        it('should reset filters when clear clicked', () => {
            renderWithProviders(
                <FilterBar
                    filters={{ ...defaultFilters, status: 'locked', type: 'text' }}
                    onFilterChange={mockOnFilterChange}
                />
            );

            fireEvent.click(screen.getByText('Clear Filters'));

            expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'all' });
        });
    });
});
