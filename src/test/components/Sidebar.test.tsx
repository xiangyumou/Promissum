import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '@/components/Sidebar';
import { renderWithProviders, type ApiItemResponse } from '@/test/utils';
import React from 'react';

// Mock dependencies
vi.mock('@/components/FilterBar', () => ({
    default: ({ filters, onFilterChange }: { filters: { search?: string }; onFilterChange: (f: Record<string, string>) => void }) => (
        <div data-testid="filter-bar">
            Filter Bar
            <button onClick={() => onFilterChange({ ...filters, search: 'test' })}>
                Update Filter
            </button>
        </div>
    )
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => <a {...props}>{children}</a>,
    usePathname: () => '/test',
    useRouter: () => ({ push: vi.fn() })
}));

// Mock framer-motion to avoid animation delays
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => <button {...props}>{children}</button>,
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
        expect(screen.getByText('Filter Bar')).toBeInTheDocument();
    });

    it('should render items list', () => {
        const items: ApiItemResponse[] = [
            { id: '1', type: 'text', decrypt_at: Date.now() + 10000, content: null, unlocked: false, metadata: { title: 'Item 1' } },
            { id: '2', type: 'image', decrypt_at: Date.now() - 10000, content: null, unlocked: true, metadata: { title: 'Item 2' } }
        ];

        renderWithProviders(<Sidebar {...defaultProps} items={items} />);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should handle item selection', () => {
        const items: ApiItemResponse[] = [{ id: '1', type: 'text', decrypt_at: Date.now() + 10000, content: null, unlocked: false }];
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
