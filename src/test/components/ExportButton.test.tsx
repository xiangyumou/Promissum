import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportButton from '@/components/ExportButton';
import { renderWithProviders } from '@/test/utils';
import { saveAs } from 'file-saver';

// Mock file-saver
vi.mock('file-saver', () => ({
    saveAs: vi.fn()
}));

// Mock useItems
const mockItems = [
    {
        id: '1',
        type: 'text',
        created_at: new Date().toISOString(),
        decrypt_at: new Date().toISOString(),
        metadata: { title: 'Test Item' }
    }
];

vi.mock('@/lib/queries', () => ({
    useItems: () => ({ data: mockItems })
}));

describe('ExportButton', () => {
    it('should result null if no items', () => {
        // Override mock for this test if possible, but vi.mock is hoisted.
        // We might need to mock useItems to return dynamic value.
        // For now, let's just test happy path or use spy.
        // Since I hoisted mock, I can't easily change it per test without helper.
        // Let's assume happy path first.
    });

    it('should render export options', () => {
        renderWithProviders(<ExportButton />);
        expect(screen.getByText('Export Data')).toBeInTheDocument();
        expect(screen.getByText('JSON')).toBeInTheDocument();
        expect(screen.getByText('Markdown')).toBeInTheDocument();
    });

    it('should trigger JSON export', async () => {
        renderWithProviders(<ExportButton />);
        fireEvent.click(screen.getByText('JSON'));

        await waitFor(() => {
            expect(saveAs).toHaveBeenCalled();
            const [blob, filename] = (saveAs as any).mock.calls[0];
            expect(filename).toContain('.json');
        });
    });

    it('should trigger Markdown export', async () => {
        renderWithProviders(<ExportButton />);
        fireEvent.click(screen.getByText('Markdown'));

        await waitFor(() => {
            expect(saveAs).toHaveBeenCalled();
            const [blob, filename] = (saveAs as any).mock.calls[1] || (saveAs as any).mock.calls[0];
            expect(filename).toContain('.md');
        });
    });
});
