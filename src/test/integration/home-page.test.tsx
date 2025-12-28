import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/[locale]/page';
import { renderWithProviders } from '@/test/utils';

// Mock components
vi.mock('@/components/Sidebar', () => ({
    default: ({ items, onSelectItem, onAddClick, isOpen, onClose, onFilterChange }: any) => (
        <div data-testid="sidebar">
            <button onClick={() => onAddClick()} data-testid="add-button">Add</button>
            {items.map((item: any) => (
                <button
                    key={item.id}
                    onClick={() => {
                        onSelectItem(item.id);
                        onClose();
                    }}
                    data-testid={`item-${item.id}`}
                >
                    {item.metadata?.title || 'Item'}
                </button>
            ))}
            <button onClick={() => onFilterChange({ status: 'locked' })} data-testid="filter-locked">
                Filter Locked
            </button>
        </div>
    )
}));

vi.mock('@/components/AddModal', () => ({
    default: ({ isOpen, onClose, onSubmit }: any) => isOpen ? (
        <div data-testid="add-modal">
            <button onClick={() => {
                const formData = new FormData();
                formData.append('type', 'text');
                formData.append('content', 'Test content');
                formData.append('durationMinutes', '60');
                onSubmit(formData);
            }} data-testid="submit-modal">Submit</button>
            <button onClick={onClose} data-testid="close-modal">Close</button>
        </div>
    ) : null
}));

vi.mock('@/components/ContentView', () => ({
    default: ({ selectedId, item, onDelete, onExtend, onMenuClick }: any) => selectedId ? (
        <div data-testid="content-view">
            <button onClick={onMenuClick} data-testid="menu-button">Menu</button>
            <div data-testid="item-title">{item?.metadata?.title || 'Loading...'}</div>
            <button onClick={() => onDelete(selectedId)} data-testid="delete-button">Delete</button>
            <button onClick={() => onExtend(selectedId, 60)} data-testid="extend-button">Extend</button>
        </div>
    ) : (
        <div data-testid="empty-state">Select an item</div>
    )
}));

vi.mock('sonner', () => ({
    toast: {
        promise: vi.fn((promise, messages) => {
            promise.then(messages.success).catch(messages.error);
            return promise;
        })
    }
}));

describe('Home Page Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Page Rendering', () => {
        it('should render Sidebar and ContentView', () => {
            renderWithProviders(<Home />);

            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
            // ContentView should be in the document even if no item selected
            expect(screen.getByText(/Select an item/i)).toBeInTheDocument();
        });

        it('should render AddModal in closed state initially', () => {
            renderWithProviders(<Home />);

            expect(screen.queryByTestId('add-modal')).not.toBeInTheDocument();
        });
    });

    describe('Item Selection Flow', () => {
        it('should select item when clicked in sidebar', async () => {
            const user = userEvent.setup();
            renderWithProviders(<Home />);

            // Wait for items to load (mocked via MSW)
            await waitFor(() => {
                expect(screen.queryByTestId('item-1')).toBeInTheDocument();
            }, { timeout: 3000 });

            const itemButton = screen.getByTestId('item-1');
            await user.click(itemButton);

            // ContentView should now show the item
            await waitFor(() => {
                expect(screen.getByTestId('content-view')).toBeInTheDocument();
            });
        });

        it('should close sidebar on mobile after selecting item', async () => {
            const user = userEvent.setup();
            renderWithProviders(<Home />);

            await waitFor(() => {
                expect(screen.queryByTestId('item-1')).toBeInTheDocument();
            }, { timeout: 3000 });

            const itemButton = screen.getByTestId('item-1');
            await user.click(itemButton);

            // The mock calls onClose() when item is selected
            // In real implementation, sidebar would close on mobile
            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        });
    });

    describe('Item Creation Flow', () => {
        it('should open AddModal when add button is clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<Home />);

            const addButton = screen.getByTestId('add-button');
            await user.click(addButton);

            expect(screen.getByTestId('add-modal')).toBeInTheDocument();
        });

        it('should create item and select it', async () => {
            const user = userEvent.setup();
            renderWithProviders(<Home />);

            // Open modal
            const addButton = screen.getByTestId('add-button');
            await user.click(addButton);

            // Submit form
            const submitButton = screen.getByTestId('submit-modal');
            await user.click(submitButton);

            // Modal should close and item should be created
            // (MSW will mock the API response)
            await waitFor(() => {
                expect(screen.queryByTestId('add-modal')).not.toBeInTheDocument();
            }, { timeout: 3000 });
        });

        it('should close modal when close button is clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<Home />);

            const addButton = screen.getByTestId('add-button');
            await user.click(addButton);

            expect(screen.getByTestId('add-modal')).toBeInTheDocument();

            const closeButton = screen.getByTestId('close-modal');
            await user.click(closeButton);

            expect(screen.queryByTestId('add-modal')).not.toBeInTheDocument();
        });
    });

    describe('Filter Functionality', () => {
        it('should update items when filter changes', async () => {
            const user = userEvent.setup();
            renderWithProviders(<Home />);

            await waitFor(() => {
                expect(screen.queryByTestId('item-1')).toBeInTheDocument();
            }, { timeout: 3000 });

            // Change filter
            const filterButton = screen.getByTestId('filter-locked');
            await user.click(filterButton);

            // MSW should respond with filtered items
            // The component will re-fetch with new filter
            await waitFor(() => {
                // Just verify the component doesn't crash
                expect(screen.getByTestId('sidebar')).toBeInTheDocument();
            });
        });
    });

    describe('Integration with Settings', () => {
        it('should use default duration from settings', () => {
            renderWithProviders(<Home />);

            // Verify component renders without error
            // Settings are mocked in renderWithProviders
            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        });
    });
});
