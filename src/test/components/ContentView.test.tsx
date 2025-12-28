import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import ContentView from '@/components/ContentView';
import { ItemDetail } from '@/lib/types';
import { timeService } from '@/lib/services/time-service';

// Mock timeService
vi.mock('@/lib/services/time-service', () => ({
    timeService: {
        now: vi.fn()
    }
}));

// Mock framer-motion to avoid animation issues
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

// Mock Lightbox
vi.mock('yet-another-react-lightbox', () => ({
    default: () => null
}));
vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({
    default: () => null
}));

describe('ContentView', () => {
    const mockOnDelete = vi.fn();
    const mockOnExtend = vi.fn();
    const mockOnMenuClick = vi.fn();

    // Locked item (unlock in future)
    const lockedItem: ItemDetail = {
        id: 'test-item-1',
        type: 'text',
        original_name: null,
        decrypt_at: Date.now() + 3600000, // 1 hour from now
        created_at: Date.now() - 86400000, // 1 day ago
        layer_count: 0,
        user_id: 'user-1',
        metadata: { title: 'Locked Item' },
        unlocked: false,
        content: null
    };

    // Unlocked item
    const unlockedItem: ItemDetail = {
        id: 'test-item-2',
        type: 'text',
        original_name: null,
        decrypt_at: Date.now() - 3600000, // 1 hour ago
        created_at: Date.now() - 86400000,
        layer_count: 0,
        user_id: 'user-1',
        metadata: { title: 'Unlocked Item' },
        unlocked: true,
        content: 'This is the secret content!'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (timeService.now as any).mockReturnValue(Date.now());
    });

    describe('Rendering', () => {
        it('should render item title', () => {
            renderWithProviders(
                <ContentView
                    selectedId="test-item-1"
                    item={lockedItem}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            expect(screen.getByText('Locked Item')).toBeInTheDocument();
        });

        it('should show empty state when no item selected', () => {
            renderWithProviders(
                <ContentView
                    selectedId={null}
                    item={undefined}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            expect(screen.getByText('Select an item')).toBeInTheDocument();
        });
    });

    describe('Locked Item State', () => {
        it('should show encrypted indicator for locked item', () => {
            renderWithProviders(
                <ContentView
                    selectedId="test-item-1"
                    item={lockedItem}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            expect(screen.getByText('Content Encrypted')).toBeInTheDocument();
            expect(screen.getByText('Time Lock Active')).toBeInTheDocument();
        });
    });

    describe('Unlocked Item State', () => {
        it('should show content for unlocked item', () => {
            renderWithProviders(
                <ContentView
                    selectedId="test-item-2"
                    item={unlockedItem}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            expect(screen.getByText('This is the secret content!')).toBeInTheDocument();
        });
    });

    describe('Image Type', () => {
        it('should render image content correctly', () => {
            const imageItem: ItemDetail = {
                ...unlockedItem,
                id: 'image-1',
                type: 'image',
                content: 'data:image/png;base64,iVBORw0KGgo=',
                metadata: { title: 'Test Image' }
            };

            renderWithProviders(
                <ContentView
                    selectedId="image-1"
                    item={imageItem}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            expect(screen.getByText('Test Image')).toBeInTheDocument();
        });
    });
});
