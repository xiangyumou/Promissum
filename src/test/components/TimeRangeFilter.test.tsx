
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterPanel from '@/components/FilterPanel';
import { FilterParams } from '@/lib/types';
import { renderWithProviders } from '../utils';

describe('FilterPanel Time Range', () => {
    const defaultFilters: FilterParams = {
        status: 'all',
        sort: 'created_desc'
    };
    const mockOnFilterChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock system time to fixed date: 2024-01-15 12:00:00 UTC
        vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    it('should call onFilterChange with today range when Today button clicked', async () => {
        renderWithProviders(
            <FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        // Expand the FilterPanel first
        const expandButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(expandButton);

        // Wait for the panel to expand and find Today button
        await waitFor(() => {
            expect(screen.getByText('Today')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Today'));

        expect(mockOnFilterChange).toHaveBeenCalled();
        const callArg = mockOnFilterChange.mock.calls[0][0];
        expect(callArg.dateRange).toBeDefined();
        expect(callArg.dateRange.start).toBeLessThan(callArg.dateRange.end);
        // Verify duration is roughly 1 day (allowing for timezone variations)
        expect(callArg.dateRange.end - callArg.dateRange.start).toBeGreaterThan(86000000);
    });

    it('should call onFilterChange with week range when This Week button clicked', async () => {
        renderWithProviders(
            <FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        // Expand the FilterPanel first
        const expandButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(expandButton);

        // Wait for the panel to expand and find This Week button
        await waitFor(() => {
            expect(screen.getByText('This Week')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('This Week'));

        expect(mockOnFilterChange).toHaveBeenCalled();
        const callArg = mockOnFilterChange.mock.calls[0][0];
        expect(callArg.dateRange).toBeDefined();
        // Week range logic: start is 7 days ago, duration should be > 6 days
        const duration = callArg.dateRange.end - callArg.dateRange.start;
        expect(duration).toBeGreaterThan(6 * 86400000);
    });

    it('should update manually when date inputs changed', async () => {
        renderWithProviders(
            <FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        // Expand the FilterPanel first
        const expandButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(expandButton);

        // Wait for the panel to expand
        await waitFor(() => {
            expect(screen.getByText('Today')).toBeInTheDocument();
        });

        // Find date inputs by type
        const dateInputs = screen.getAllByDisplayValue('');
        const startInput = dateInputs.find(input =>
            input.getAttribute('type') === 'date'
        ) as HTMLInputElement;

        expect(startInput).toBeDefined();

        fireEvent.change(startInput, { target: { value: '2024-01-01' } });

        expect(mockOnFilterChange).toHaveBeenCalled();
        const callArg = mockOnFilterChange.mock.calls[0][0];
        expect(callArg.dateRange).toBeDefined();
        // Since we set start, verify it's set correctly
        expect(callArg.dateRange.start).toBe(new Date('2024-01-01').getTime());
    });
});
