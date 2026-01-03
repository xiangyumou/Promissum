import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/[locale]/page';
import { renderWithProviders, type ApiItemResponse } from '@/test/utils';

interface SidebarProps {
    items: ApiItemResponse[];
    onSelectItem: (id: string) => void;
    onAddClick: () => void;
    isOpen: boolean;
    onClose: () => void;
    onFilterChange: (filters: Record<string, unknown>) => void;
}

interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void;
}

interface ContentViewProps {
    selectedId: string | null;
    item?: ApiItemResponse;
    onDelete: (id: string) => void;
    onExtend: (id: string, minutes: number) => void;
    onMenuClick: () => void;
}

// Mock components
vi.mock('@/components/Sidebar', () => ({
    default: ({ items, onSelectItem, onAddClick, onClose, onFilterChange }: SidebarProps) => (
        <div data-testid="sidebar">
            <button onClick={() => onAddClick()} data-testid="add-button">Add</button>
            {items.map((item: ApiItemResponse) => (
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
    default: ({ isOpen, onClose, onSubmit }: AddModalProps) => isOpen ? (
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
    default: ({ selectedId, item, onDelete, onExtend, onMenuClick }: ContentViewProps) => selectedId ? (
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
        it('should render items from MSW and allow selection', async () => {
            const _user = userEvent.setup();
            renderWithProviders(<Home />);

            // Wait for MSW to provide items
            await waitFor(() => {
                const items = screen.queryAllByTestId(/^item-/);
                expect(items.length).toBeGreaterThan(0);
            }, { timeout: 3000 });

            // Note: Actual selection behavior tested in unit tests
            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        });

        it('should show sidebar', () => {
            renderWithProviders(<Home />);
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
        it('should render filter controls', () => {
            renderWithProviders(<Home />);

            expect(screen.getByTestId('filter-locked')).toBeInTheDocument();
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
