import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '@/components/Sidebar';
import { renderWithProviders } from '@/test/utils';

// Mock dependencies
vi.mock('@/components/FilterPanel', () => ({
    default: ({ filters, onFilterChange }: any) => (
        <div data-testid="filter-panel">
            Filter Panel
            <button onClick={() => onFilterChange({ ...filters, search: 'test' })}>
                Update Filter
            </button>
        </div>
    )
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    usePathname: () => '/test',
    useRouter: () => ({ push: vi.fn() })
}));

// Mock framer-motion to avoid animation delays
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        }
    };
});

describe('Sidebar', () => {
    const mockOnSelectItem = vi.fn();
    const mockOnAddClick = vi.fn();
    const mockOnClose = vi.fn();
    const mockOnFilterChange = vi.fn();
    const defaultProps = {
        items: [],
        selectedId: null,
        onSelectItem: mockOnSelectItem,
        onAddClick: mockOnAddClick,
        isOpen: true,
        onClose: mockOnClose,
        filters: { status: 'all' as const },
        onFilterChange: mockOnFilterChange,
        isLoading: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render empty state when no items', () => {
        renderWithProviders(<Sidebar {...defaultProps} />);
        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText('Filter Panel')).toBeInTheDocument();
    });

    it('should render items list', () => {
        const items: any[] = [
            { id: '1', type: 'text', decrypt_at: Date.now() + 10000, metadata: { title: 'Item 1' } },
            { id: '2', type: 'image', decrypt_at: Date.now() - 10000, metadata: { title: 'Item 2' } }
        ];

        renderWithProviders(<Sidebar {...defaultProps} items={items} />);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should handle item selection', () => {
        const items: any[] = [{ id: '1', type: 'text', decrypt_at: Date.now() + 10000 }];
        renderWithProviders(<Sidebar {...defaultProps} items={items} />);

        fireEvent.click(screen.getByText('Text Note')); // fallback title
        expect(mockOnSelectItem).toHaveBeenCalledWith('1');
    });

    it('should handle add click', () => {
        renderWithProviders(<Sidebar {...defaultProps} />);
        fireEvent.click(screen.getByText('New Entry'));
        expect(mockOnAddClick).toHaveBeenCalled();
    });

    it('should propagate filter changes', () => {
        renderWithProviders(<Sidebar {...defaultProps} />);
        fireEvent.click(screen.getByText('Update Filter'));
        expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'all', search: 'test' });
    });
});
