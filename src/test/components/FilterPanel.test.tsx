import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterPanel from '@/components/FilterPanel';
import { renderWithProviders } from '@/test/utils';
import { FilterParams } from '@/lib/api-client';
import { useSettings } from '@/lib/stores/settings-store';

describe('FilterPanel', () => {
    const mockOnFilterChange = vi.fn();
    const defaultFilters: FilterParams = {
        status: 'all',
        sort: 'created_desc'
    };

    // Move mock definition inside beforeEach to correctly use local variables if needed, 
    // or just defined globally and updated.

    // We need to return a mock from the module
    // The previous vi.mock block is already there (from my previous tool call), but it was flawed due to hoisting.
    // Let's fix it by defining the mock factory to return a constant that we can reference, or simply creating new mocks in beforeEach.

    // Actually, I can't undo the previous `replace_file_content` easily without knowing line numbers exactly, but I can overwrite it.
    // The previous edit inserted `vi.mock(...)` after `beforeEach`.
    // I will replace the whole describe block content start to ensure clean state.

    // Correct approach:
    // Define mock impl outside or use `vi.doMock`? `vi.mock` is better.
    // I will use a simple factory and override implementation in beforeEach.

    // Let's just fix the mock setup in this replacement.

    const mockAddFilterPreset = vi.fn();
    const mockRemoveFilterPreset = vi.fn();

    // Mock the module globally, but set its return value in beforeEach
    vi.mock('@/lib/stores/settings-store', async (importOriginal) => {
        const mod = await importOriginal<typeof import('@/lib/stores/settings-store')>();
        return {
            ...mod,
            useSettings: vi.fn(), // Mock useSettings as a vi.fn()
        };
    });

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock return for useSettings
        (useSettings as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            filterPresets: [{
                id: 'preset-1',
                name: 'My Preset',
                filters: { status: 'locked', search: 'my search' },
                createdAt: Date.now()
            }],
            addFilterPreset: mockAddFilterPreset,
            removeFilterPreset: mockRemoveFilterPreset,
        });
    });

    const renderExpanded = (filters = defaultFilters) => {
        const result = renderWithProviders(
            <FilterPanel
                filters={filters}
                onFilterChange={mockOnFilterChange}
            />
        );
        // Use all by title as there might be multiple elements or SVG titles
        // The main toggle button is what we want
        const buttons = screen.getAllByTitle(/filters/i);
        fireEvent.click(buttons[0]);
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
        const trigger = screen.getAllByTitle(/filters/i)[0];
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

    it('should call onFilterChange when status changed to unlocked', () => {
        renderExpanded();
        fireEvent.click(screen.getByText('Unlocked').closest('button')!);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, status: 'unlocked' });
    });

    it('should call onFilterChange when type changed to image', () => {
        renderExpanded();
        fireEvent.click(screen.getByText('Image').closest('button')!);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, type: 'image' });
    });

    it('should call onFilterChange when status changed to all', () => {
        renderExpanded({ ...defaultFilters, status: 'locked' });
        const allBtns = screen.getAllByText('All');
        fireEvent.click(allBtns[0]);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, status: 'all' });
    });

    it('should call onFilterChange when type changed to all', () => {
        renderExpanded({ ...defaultFilters, type: 'text' });
        const allBtns = screen.getAllByText('All');
        fireEvent.click(allBtns[1]);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, type: undefined });
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
            dateRange: undefined,
            quickFilter: undefined,
        });
    });

    // Preset Tests
    it('should show save preset dialog when save button clicked', () => {
        renderExpanded({ ...defaultFilters, search: 'test' }); // Needs active filters to enable button

        // Find Save Preset button (it has text "Save Preset" or Icon)
        // Adjust selector based on implementation. Button has text "Save Preset"
        const saveBtn = screen.getByRole('button', { name: /save preset/i });
        fireEvent.click(saveBtn);

        expect(screen.getByText('Preset Name')).toBeInTheDocument(); // Dialog content
    });

    it('should not show save preset button enabled if no active filters', () => {
        renderExpanded(defaultFilters); // No active filters

        const saveBtn = screen.getByRole('button', { name: /save preset/i });
        expect(saveBtn).toBeDisabled();
    });

    // Note: We need to mock useSettings to test loading/deleting presets effectively.
    // Since we are using renderWithProviders which uses a real store (or mocked store),
    // we might need to rely on the store's initial state or mock the hook.
    // For now, let's assume the store is empty or we can spy on it.
    // A more robust approach would be to spy on useSettings or pass initial state if supported.
    // Quick Filters
    it('should select quick filter', () => {
        renderExpanded();

        // Unlock Soon
        const unlockingSoonBtn = screen.getByText(/Unlocking Soon/i).closest('button')!;
        fireEvent.click(unlockingSoonBtn);
        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            quickFilter: 'unlocking-soon'
        });
    });

    it('should deselect quick filter', () => {
        // Start with active filter
        renderExpanded({ ...defaultFilters, quickFilter: 'unlocking-soon' });

        const activeBtn = screen.getByText(/Unlocking Soon/i).closest('button')!;
        fireEvent.click(activeBtn);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            quickFilter: undefined
        });
    });

    it('should handle Long Locked quick filter', () => {
        renderExpanded();
        const btn = screen.getByText(/Long-term/i).closest('button')!;
        fireEvent.click(btn);
        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            quickFilter: 'long-locked'
        });
    });

    it('should handle Recently Created quick filter', () => {
        renderExpanded();
        const btn = screen.getByText(/Recently Created/i).closest('button')!;
        fireEvent.click(btn);
        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            quickFilter: 'recent'
        });
    });

    // Date Range Helpers
    it('should clear date range', () => {
        const start = Date.now();
        renderExpanded({ ...defaultFilters, dateRange: { start, end: start + 1000 } });

        const clearBtn = screen.getByTitle(/clear date range/i);
        fireEvent.click(clearBtn);

        expect(mockOnFilterChange).toHaveBeenCalledWith({
            ...defaultFilters,
            dateRange: undefined
        });
    });

    it('should update start date manually', () => {
        renderExpanded();

        // Find inputs - they don't have good labels in current implementation, relying on index or placeholder?
        // Implementation: <label>Start</label><input type="date">
        // Testing-library can verify by label text

        // Inputs are type="date", labels are "Start" and "End" uppercase in tracking-wider -> actually just "Start" text

        // Using "Start" might match multiple things?
        // Let's use getByLabelText or similar logic. The label has class uppercase...

        // Actually, the label implementation is:
        // <label ...>Start</label>
        // <input .../>
        // But the input is NOT nested inside label and no htmlFor. So getByLabelText won't work automatically.
        // We will look for input near the label or use container queries.

        // Simplified approach: get all date inputs
        const startLabel = screen.getByText(/^Start$/);
        const startInput = startLabel.nextElementSibling as HTMLInputElement;

        fireEvent.change(startInput, { target: { value: '2023-01-01' } });

        // Default end date should be set (start + 1 day)
        const expectedStart = new Date('2023-01-01').getTime();
        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            dateRange: expect.objectContaining({
                start: expectedStart,
                end: expectedStart + 86400000
            })
        }));
    });

    it('should update end date manually', () => {
        const start = new Date('2023-01-01').getTime();
        renderExpanded({ ...defaultFilters, dateRange: { start, end: start + 86400000 } });

        const endLabel = screen.getByText(/^End$/);
        const endInput = endLabel.nextElementSibling as HTMLInputElement;

        fireEvent.change(endInput, { target: { value: '2023-01-05' } });

        const expectedEnd = new Date('2023-01-05').setHours(23, 59, 59, 999);

        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            dateRange: expect.objectContaining({
                start: start,
                end: expectedEnd
            })
        }));
    });

    it('should set start date to 1 day before end if start is missing when setting end', () => {
        renderExpanded(); // No date range

        const endLabel = screen.getByText(/^End$/);
        const endInput = endLabel.nextElementSibling as HTMLInputElement;

        const testDate = '2023-01-05';
        fireEvent.change(endInput, { target: { value: testDate } });

        const expectedEnd = new Date(testDate).setHours(23, 59, 59, 999);
        const expectedStart = expectedEnd - 86400000;

        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            dateRange: { start: expectedStart, end: expectedEnd }
        }));
    });

    // Sort Options
    it('should handle all sort options', () => {
        renderExpanded();

        // Decrypt Desc (Unlock soon)
        fireEvent.click(screen.getByText(/Unlock soon/i).closest('button')!);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, sort: 'decrypt_desc' });

        // Decrypt Asc (Unlock late)
        fireEvent.click(screen.getByText(/Unlock late/i).closest('button')!);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, sort: 'decrypt_asc' });

        // Created Desc (Newest)
        fireEvent.click(screen.getByText(/Newest/i).closest('button')!);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ ...defaultFilters, sort: 'created_desc' });
    });

    // Presets
    it('should load preset when clicked', () => {
        renderExpanded(); // Should render mock presets

        fireEvent.click(screen.getByText('My Preset'));

        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            status: 'locked',
            search: 'my search'
        }));
    });

    it('should delete preset when trash icon clicked', () => {
        renderExpanded();

        // Need to trigger hover? The implementation relies on group-hover for visibility but click checks usually don't care about visibility unless checkVisibility is on?
        // testing-library usually finds it if in DOM. Class has opacity-0 group-hover:opacity-100.
        // It might be considered invisible? 
        // Let's try finding by title 'Delete Preset'

        const deleteBtn = screen.getByTitle('Delete Preset');
        fireEvent.click(deleteBtn);

        expect(mockRemoveFilterPreset).toHaveBeenCalledWith('preset-1');
    });

    it('should save preset', async () => {
        renderExpanded({ ...defaultFilters, search: 'test save' });

        // Open dialog
        fireEvent.click(screen.getByRole('button', { name: /save preset/i }));

        const input = screen.getByPlaceholderText(/e.g. My Favorite Filter/i);
        fireEvent.change(input, { target: { value: 'New Preset' } });

        const confirmBtn = screen.getByRole('button', { name: /save/i });
        fireEvent.click(confirmBtn);

        expect(mockAddFilterPreset).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Preset',
            filters: expect.objectContaining({ search: 'test save' })
        }));
    });
});
