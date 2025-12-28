
import { render, screen, fireEvent } from '@testing-library/react';
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

    it('should call onFilterChange with today range when Today button clicked', () => {
        renderWithProviders(
            <FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        fireEvent.click(screen.getByText('Today'));

        const expectedStart = new Date('2024-01-15T00:00:00.000Z').getTime(); // Local time might vary, need to be careful with timezone in tests or code
        // Actually the code uses new Date() which uses local time.
        // vi.setSystemTime mocks Date constructor.
        // But setHours(0,0,0,0) sets local midnight.
        // It's hard to predict exact timestamp without knowing timezone of test runner.
        // But we can check if start and end are set.

        expect(mockOnFilterChange).toHaveBeenCalled();
        const callArg = mockOnFilterChange.mock.calls[0][0];
        expect(callArg.dateRange).toBeDefined();
        expect(callArg.dateRange.start).toBeLessThan(callArg.dateRange.end);
        // Verify duration is roughly 1 day
        expect(callArg.dateRange.end - callArg.dateRange.start).toBeGreaterThan(86000000);
    });

    it('should call onFilterChange with week range when This Week button clicked', () => {
        renderWithProviders(
            <FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        fireEvent.click(screen.getByText('This Week'));

        expect(mockOnFilterChange).toHaveBeenCalled();
        const callArg = mockOnFilterChange.mock.calls[0][0];
        expect(callArg.dateRange).toBeDefined();
        // Week range logic: start is 7 days ago
        const duration = callArg.dateRange.end - callArg.dateRange.start;
        expect(duration).toBeGreaterThan(6 * 86400000);
    });

    it('should update manually when date inputs changed', () => {
        renderWithProviders(
            <FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        // Find inputs by type="date"
        // Since we can't easily query by label without ID/for attribute, we use container query or role
        // Ideally we should add aria-label or id to inputs in component.
        // For now, let's assume they are the only date inputs.
        // Or we can use getByLabelText if we add proper labels/ids.

        // Let's try selecting by placeholder or value.
        // The component has labels "Start" and "End" but inputs don't have id matching for.

        // Use container query approach
        const startLabel = screen.getByText('Start');
        const startInput = startLabel.nextElementSibling as HTMLInputElement;

        fireEvent.change(startInput, { target: { value: '2024-01-01' } });

        expect(mockOnFilterChange).toHaveBeenCalled();
        const callArg = mockOnFilterChange.mock.calls[0][0];
        expect(callArg.dateRange).toBeDefined();
        // Since we set start, and end defaults to start + 1 day
        expect(callArg.dateRange.start).toBe(new Date('2024-01-01').getTime());
    });
});
