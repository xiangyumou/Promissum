import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExportButton from '@/components/ExportButton';
import { renderWithProviders } from '@/test/utils';
import { saveAs } from 'file-saver';
import * as queries from '@/lib/queries';

// Mock file-saver
vi.mock('file-saver', () => ({
    saveAs: vi.fn()
}));

// Mock useItems - we'll control this per test
vi.mock('@/lib/queries', () => ({
    useItems: vi.fn()
}));

describe('ExportButton', () => {
    const mockItems = [
        {
            id: '1',
            type: 'text',
            created_at: new Date().toISOString(),
            decrypt_at: new Date().toISOString(),
            metadata: { title: 'Test Item 1' }
        },
        {
            id: '2',
            type: 'image',
            created_at: new Date().toISOString(),
            decrypt_at: new Date().toISOString(),
            metadata: { title: 'Test Image' }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Default to returning items
        (queries.useItems as any).mockReturnValue({ data: mockItems });
    });

    describe('Rendering', () => {
        it('should render export section title', () => {
            renderWithProviders(<ExportButton />);
            expect(screen.getByText('Export Data')).toBeInTheDocument();
        });

        it('should render JSON export button', () => {
            renderWithProviders(<ExportButton />);
            expect(screen.getByText('JSON')).toBeInTheDocument();
        });

        it('should render Markdown export button', () => {
            renderWithProviders(<ExportButton />);
            expect(screen.getByText('Markdown')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should return null when no items available', () => {
            (queries.useItems as any).mockReturnValue({ data: [] });

            const { container } = renderWithProviders(<ExportButton />);

            // Component should not render anything (return null)
            expect(container.firstChild).toBeNull();
        });

        it('should return null when data is undefined', () => {
            (queries.useItems as any).mockReturnValue({ data: undefined });

            const { container } = renderWithProviders(<ExportButton />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe('JSON Export', () => {
        it('should trigger JSON export when clicked', async () => {
            renderWithProviders(<ExportButton />);

            fireEvent.click(screen.getByText('JSON'));

            await waitFor(() => {
                expect(saveAs).toHaveBeenCalled();
            });
        });

        it('should export with correct filename format', async () => {
            renderWithProviders(<ExportButton />);

            fireEvent.click(screen.getByText('JSON'));

            await waitFor(() => {
                expect(saveAs).toHaveBeenCalled();
                const [, filename] = (saveAs as any).mock.calls[0];
                expect(filename).toContain('.json');
            });
        });
    });

    describe('Markdown Export', () => {
        it('should trigger Markdown export when clicked', async () => {
            vi.clearAllMocks();
            renderWithProviders(<ExportButton />);

            fireEvent.click(screen.getByText('Markdown'));

            await waitFor(() => {
                expect(saveAs).toHaveBeenCalled();
            });
        });

        it('should export with correct filename format', async () => {
            vi.clearAllMocks();
            renderWithProviders(<ExportButton />);

            fireEvent.click(screen.getByText('Markdown'));

            await waitFor(() => {
                expect(saveAs).toHaveBeenCalled();
                const [, filename] = (saveAs as any).mock.calls[0];
                expect(filename).toContain('.md');
            });
        });
    });
});
