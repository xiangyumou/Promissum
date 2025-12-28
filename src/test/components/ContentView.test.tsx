import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils';
import ContentView from '@/components/ContentView';
import { ApiItemDetail } from '@/lib/types';
import { timeService } from '@/lib/services/time-service';
import { useSettings } from '@/lib/stores/settings-store';
import { useSessions } from '@/hooks/useSessions';

// Mock timeService
vi.mock('@/lib/services/time-service', () => ({
    timeService: {
        now: vi.fn()
    }
}));

// Mock useActiveSession
vi.mock('@/hooks/useActiveSession', () => ({
    useActiveSession: vi.fn()
}));

// Mock useSessions
vi.mock('@/hooks/useSessions', () => ({
    useSessions: vi.fn().mockReturnValue({ data: [] })
}));

// Mock next-intl
vi.mock('next-intl', async () => {
    const actual = await vi.importActual('next-intl');
    return {
        ...actual,
        useTranslations: (namespace?: string) => (key: string) => key,
        useLocale: () => 'en',
    };
});

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
            span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        }
    };
});

// Mock Lightbox
vi.mock('yet-another-react-lightbox', () => ({
    default: ({ open, close }: any) => open ? (
        <div data-testid="lightbox">
            <button onClick={close} data-testid="close-lightbox">Close</button>
        </div>
    ) : null
}));
vi.mock('yet-another-react-lightbox/plugins/zoom', () => ({
    default: () => null
}));

// Mock settings store
vi.mock('@/lib/stores/settings-store', async () => {
    const actual = await vi.importActual('@/lib/stores/settings-store');
    return {
        ...actual,
        useSettings: Object.assign(vi.fn(), {
            getState: vi.fn(),
            setState: vi.fn(),
            subscribe: vi.fn(),
            destroy: vi.fn(),
        })
    };
});

describe('ContentView', () => {
    const mockOnDelete = vi.fn();
    const mockOnExtend = vi.fn();
    const mockOnMenuClick = vi.fn();

    const lockedItem: ApiItemDetail = {
        id: 'test-item-1',
        type: 'text',
        decrypt_at: Date.now() + 3600000,
        unlocked: false,
        metadata: { title: 'Locked Item' }
    };

    const unlockedItem: ApiItemDetail = {
        id: 'test-item-2',
        type: 'text',
        decrypt_at: Date.now() - 3600000,
        unlocked: true,
        content: 'This is the secret content!',
        metadata: { title: 'Unlocked Item' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (timeService.now as any).mockReturnValue(Date.now());
        // Default settings
        (useSettings.getState as any).mockReturnValue({
            confirmDelete: true,
            confirmExtend: true,
            sidebarOpen: false,
            setSidebarOpen: vi.fn()
        });
        (useSettings as any).mockReturnValue({
            sidebarOpen: false,
            setSidebarOpen: vi.fn(),
            confirmDelete: true,
            confirmExtend: true
        });
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

            expect(screen.getByText('selectItem')).toBeInTheDocument();
        });
    });

    describe('Image Type', () => {
        it('should render image content correctly and open lightbox on click', async () => {
            const user = userEvent.setup();
            const imageItem: ApiItemDetail = {
                ...unlockedItem,
                id: 'image-1',
                type: 'image',
                content: 'iVBORw0KGgo=',
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

            const img = screen.getByAltText('Decrypted content');
            expect(img).toBeInTheDocument();

            await user.click(img.closest('div')!);
            expect(screen.getByTestId('lightbox')).toBeInTheDocument();
        });
    });

    describe('Delete Functionality', () => {
        it('should call onDelete when delete button is clicked (no confirmation required)', async () => {
            const user = userEvent.setup();
            (useSettings as any).mockReturnValue({ confirmDelete: false });

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

            const deleteBtn = screen.getByTitle('delete');
            await user.click(deleteBtn);

            expect(mockOnDelete).toHaveBeenCalledWith('test-item-2');
        });

        it('should require double click when confirmation is enabled', async () => {
            const user = userEvent.setup();
            (useSettings as any).mockReturnValue({ confirmDelete: true });

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

            const deleteBtn = screen.getByTitle('delete');
            await user.click(deleteBtn);
            expect(mockOnDelete).not.toHaveBeenCalled();
            expect(screen.getByText('confirm')).toBeInTheDocument();

            await user.click(deleteBtn);
            expect(mockOnDelete).toHaveBeenCalledWith('test-item-2');
        });
    });

    describe('Extend Functionality', () => {
        it('should show extend dropdown and call onExtend when an option is clicked', async () => {
            const user = userEvent.setup();
            (useSettings as any).mockReturnValue({ confirmExtend: false });

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

            const extendBtn = screen.getByTitle('extendLock');
            await user.click(extendBtn);

            await user.click(screen.getByText('+1 hour'));
            expect(mockOnExtend).toHaveBeenCalledWith('test-item-1', 60);
        });
    });

    describe('Viewer Count', () => {
        it('should show viewer count when sessions are present', () => {
            (useSessions as any).mockReturnValue({
                data: [{ id: 's1' }, { id: 's2' }]
            });

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

            expect(screen.getByText('2 viewers')).toBeInTheDocument();
        });

        it('should handle zero viewers', () => {
            (useSessions as any).mockReturnValue({ data: [] });

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

            // With zero viewers, viewer count should not be displayed
            expect(screen.queryByText(/viewers/)).not.toBeInTheDocument();
        });

        it('should handle many viewers (100+)', () => {
            const manySessions = Array.from({ length: 150 }, (_, i) => ({ id: `s${i}` }));
            (useSessions as any).mockReturnValue({ data: manySessions });

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

            expect(screen.getByText('150 viewers')).toBeInTheDocument();
        });
    });

    describe('Edge Cases - Data Integrity', () => {
        it('should handle item without metadata', () => {
            const itemWithoutMetadata: ApiItemDetail = {
                id: 'no-meta',
                type: 'text',
                decrypt_at: Date.now() + 3600000,
                unlocked: false,
                content: null
            };

            renderWithProviders(
                <ContentView
                    selectedId="no-meta"
                    item={itemWithoutMetadata}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            // Should show fallback translation key 'textNote' from Common
            expect(screen.getByText('textNote')).toBeInTheDocument();
        });

        it('should show fallback title when title is missing', () => {
            const itemWithEmptyMetadata: ApiItemDetail = {
                id: 'empty-meta',
                type: 'text',
                decrypt_at: Date.now() + 3600000,
                unlocked: false,
                content: null,
                metadata: {}
            };

            renderWithProviders(
                <ContentView
                    selectedId="empty-meta"
                    item={itemWithEmptyMetadata}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            // Should show fallback translation key
            expect(screen.getByText('textNote')).toBeInTheDocument();
        });

        it('should show image fallback for image type without title', () => {
            const imageWithoutTitle: ApiItemDetail = {
                id: 'img-no-title',
                type: 'image',
                decrypt_at: Date.now() - 1000,
                unlocked: true,
                content: 'valid base64',
                metadata: {}
            };

            renderWithProviders(
                <ContentView
                    selectedId="img-no-title"
                    item={imageWithoutTitle}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            // Should show 'image' translation key
            expect(screen.getByText('image')).toBeInTheDocument();
        });

        it('should handle very long content text', () => {
            const longContent = 'a'.repeat(10000);
            const longItem: ApiItemDetail = {
                ...unlockedItem,
                content: longContent
            };

            renderWithProviders(
                <ContentView
                    selectedId="test-item-2"
                    item={longItem}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            // Content should be rendered (even if extremely long)
            expect(screen.getByText(longContent)).toBeInTheDocument();
        });

        it('should handle invalid base64 image data gracefully', () => {
            const invalidImageItem: ApiItemDetail = {
                id: 'invalid-img',
                type: 'image',
                decrypt_at: Date.now() - 1000,
                unlocked: true,
                content: 'definitely-not-valid-base64',
                metadata: { title: 'Invalid Image' }
            };

            renderWithProviders(
                <ContentView
                    selectedId="invalid-img"
                    item={invalidImageItem}
                    isLoading={false}
                    onDelete={mockOnDelete}
                    onExtend={mockOnExtend}
                    onMenuClick={mockOnMenuClick}
                />
            );

            // Image element should still be rendered
            const img = screen.getByAltText('Decrypted content');
            expect(img).toBeInTheDocument();
            // Should have constructed data URL
            expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png;base64,'));
        });

        it('should handle session data errors (undefined)', () => {
            // Mock sessions to return undefined (error case)
            (useSessions as any).mockReturnValue({ data: undefined });

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

            // Should not crash, viewer count should not be shown
            expect(screen.queryByText(/viewers/)).not.toBeInTheDocument();
        });

        it('should handle session data errors (null)', () => {
            (useSessions as any).mockReturnValue({ data: null });

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

            // Should not crash
            expect(screen.queryByText(/viewers/)).not.toBeInTheDocument();
        });
    });
});
