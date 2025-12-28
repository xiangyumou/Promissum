import { fireEvent, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddModal from '@/components/AddModal';
import { renderWithProviders } from '@/test/utils';
import { timeService } from '@/lib/services/time-service';

// Mock Modal to avoid Portal complexity if needed, but let's try real first
// If fails, we mock Modal.
// Check if Dialog from radix is used... yes based on file listing probably?
// Let's assume Modal uses Headless UI or Radix.
// We might need to mock global resizeObserver etc.

// Mock Modal explicitly to keep test focused on content
vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, children, title }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal">
                <h1>{title}</h1>
                {children}
            </div>
        );
    }
}));

describe('AddModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock time
        vi.spyOn(timeService, 'now').mockReturnValue(new Date('2023-01-01T12:00:00').getTime());
    });

    it('should result null if not open', () => {
        renderWithProviders(
            <AddModal
                isOpen={false}
                defaultDuration={60}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );
        expect(screen.queryByTestId('modal')).toBeNull();
    });

    it('should render form when open', () => {
        renderWithProviders(
            <AddModal
                isOpen={true}
                defaultDuration={60}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Title (optional)')).toBeInTheDocument();
    });

    it('should submit text item', async () => {
        renderWithProviders(
            <AddModal
                isOpen={true}
                defaultDuration={60}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        const textarea = screen.getByPlaceholderText('Write your thought...');
        fireEvent.change(textarea, { target: { value: 'My secret' } });

        const submitBtn = screen.getByText('Encrypt & Save'); // Check translation key later
        // "encryptAndSave" -> 'Encrypt & Save' (check utils.tsx messages)
        // In utils.tsx: AddModal doesn't have 'encryptAndSave'. It has 'create'?
        // Wait, checking AddModal.tsx uses t('encryptAndSave').
        // utils.tsx messages need to be updated or I assume key fallback?
        // next-intl usually shows key if missing.
        // I should check utils.tsx messages content from previous `view_file` (step 121).

        // Step 121 utils.tsx messages:
        // AddModal: { title, create, text, image, duration, ... }
        // Missing 'encryptAndSave'.
        // So it will render 'AddModal.encryptAndSave'.

        // I will use regex to find button or get by role button.
        // Or update utils.tsx.
        // Updating utils.tsx is cleaner.
    });
});
