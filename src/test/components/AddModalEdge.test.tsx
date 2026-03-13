import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddModal from '@/components/AddModal';
import { renderWithProviders } from '@/test/utils';
import * as Dialog from '@radix-ui/react-dialog';

// Mock dependencies
vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, children }: any) => isOpen ? (
        <div data-testid="modal">
            <Dialog.Root open={isOpen}>
                <Dialog.Portal>
                    <Dialog.Content>
                        <Dialog.Title>Add New Secret</Dialog.Title>
                        <Dialog.Description>Create a new time-locked secret</Dialog.Description>
                        {children}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    ) : null
}));

// Mock Drag & Drop

// Helper to advance to step 2
const advanceToStep2 = () => {
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
};

// Helper to advance to step 3
const advanceToStep3 = (enterContent = true) => {
    advanceToStep2();
    if (enterContent) {
        const textarea = screen.getByPlaceholderText('Write your thought...');
        fireEvent.change(textarea, { target: { value: 'Valid content' } });
    }
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
};

// Helper to advance to step 4 (review)
const advanceToStep4 = () => {
    advanceToStep3();
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
};

describe('AddModal Edge Cases', () => {
    const mockOnAdd = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Wizard Flow', () => {
        it('should start at step 1', () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );
            expect(screen.getByText('What would you like to encrypt?')).toBeInTheDocument();
        });

        it('should navigate forward and backward', () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            // Step 1 -> 2
            fireEvent.click(screen.getByRole('button', { name: /Next/i }));
            expect(screen.getByPlaceholderText('Title (optional)')).toBeInTheDocument();

            // Step 2 -> 1
            fireEvent.click(screen.getByRole('button', { name: /Back/i }));
            expect(screen.getByText('What would you like to encrypt?')).toBeInTheDocument();
        });
    });

    describe('Step 2: Content Validation', () => {
        it('should validate text content before proceeding', () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            advanceToStep2();

            const nextBtn = screen.getByRole('button', { name: /Next/i });
            expect(nextBtn).toBeDisabled();

            const textarea = screen.getByPlaceholderText('Write your thought...');
            fireEvent.change(textarea, { target: { value: 'Valid content' } });
            expect(nextBtn).not.toBeDisabled();
        });
    });

    describe('Step 3: Time Validation', () => {
        it('should validate duration input', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            advanceToStep3();

            const durationInput = screen.getByPlaceholderText('0');
            fireEvent.change(durationInput, { target: { value: '0' } });

            // Wait for re-render and validation message
            await waitFor(() => {
                expect(screen.getByText('Check Input')).toBeInTheDocument();
            });
        });
    });

    describe('Step 4: Submission', () => {
        it('should submit valid data', async () => {
            renderWithProviders(
                <AddModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnAdd} defaultDuration={60} />
            );

            advanceToStep4();

            const submitBtn = screen.getByText('Encrypt & Save');
            expect(submitBtn).not.toBeDisabled();

            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockOnAdd).toHaveBeenCalled();
            });
        });
    });
});

