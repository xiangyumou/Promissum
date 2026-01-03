import { fireEvent, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import AddModal from '@/components/AddModal';
import { renderWithProviders } from '@/test/utils';
import { timeService } from '@/lib/services/time-service';

// Mock timeService
vi.mock('@/lib/services/time-service', () => ({
    timeService: {
        now: vi.fn()
    }
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

// Mock Modal to simplify testing
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

// Mock ImageUploadZone
vi.mock('@/components/ImageUploadZone', () => ({
    default: ({ file, onFileChange }: any) => (
        <div data-testid="image-upload-zone">
            {file ? <span>File: {file.name}</span> : <span>No file</span>}
            <input
                type="file"
                data-testid="file-input"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
        </div>
    )
}));

// Mock next-intl - include NextIntlClientProvider for renderWithProviders
vi.mock('next-intl', async (importOriginal) => {
    const actual = await importOriginal() as object;
    return {
        ...actual,
        useTranslations: (namespace: string) => (key: string) => {
            const translations: Record<string, Record<string, string>> = {
                AddModal: {
                    title: 'New Entry',
                    itemTitle: 'Title',
                    titlePlaceholder: 'Title (optional)',
                    enterContent: 'Enter your content',
                    lockDuration: 'Lock Duration',
                    duration: 'Duration',
                    customDate: 'Custom Date',
                    reset: 'Reset',
                    remaining: 'Remaining',
                    invalidTime: 'Invalid time',
                    checkInput: 'Check input',
                    encrypting: 'Encrypting...',
                    encryptAndSave: 'Encrypt & Save'
                },
                Wizard: {
                    step1Title: 'Choose Content Type',
                    step2Title: 'Enter Content',
                    step3Title: 'Set Lock Duration',
                    step4Title: 'Review & Confirm',
                    stepProgress: 'Step {current} of {total}',
                    selectContentType: 'What type of content?',
                    textNoteDesc: 'Write a secret note',
                    imageDesc: 'Upload an image',
                    textContent: 'Text Content',
                    imageContent: 'Image Content',
                    contentType: 'Content Type',
                    contentPreview: 'Content Preview',
                    reviewBeforeSubmit: 'Review before submitting',
                    previousStep: 'Back',
                    nextStep: 'Next'
                },
                Common: {
                    textNote: 'Text Note',
                    image: 'Image',
                    unlocksAt: 'Unlocks at'
                }
            };
            return translations[namespace]?.[key] || key;
        }
    };
});

describe('AddModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const NOW = new Date('2023-06-15T12:00:00').getTime();

    beforeEach(() => {
        vi.clearAllMocks();
        (timeService.now as any).mockReturnValue(NOW);
    });

    describe('Rendering', () => {
        it('should return null if not open', () => {
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

        it('should render modal when open', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );
            expect(screen.getByTestId('modal')).toBeInTheDocument();
            expect(screen.getByText('New Entry')).toBeInTheDocument();
        });

        it('should render step progress indicator', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );
            // Step 1 title
            expect(screen.getByText('Choose Content Type')).toBeInTheDocument();
            // Step progress
            expect(screen.getByText(/Step \{current\} of \{total\}/)).toBeInTheDocument();
        });
    });

    describe('Step 1: Content Type Selection', () => {
        it('should show content type options', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByText('Text Note')).toBeInTheDocument();
            expect(screen.getByText('Image')).toBeInTheDocument();
        });

        it('should allow selecting text type', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Text Note'));
            // Text type should be selected (visual feedback via classes)
            const textButton = screen.getByText('Text Note').closest('button');
            expect(textButton?.className).toContain('border-primary');
        });

        it('should allow selecting image type', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Image'));
            const imageButton = screen.getByText('Image').closest('button');
            expect(imageButton?.className).toContain('border-primary');
        });

        it('should proceed to step 2 when Next is clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Next'));
            // Should now be on Step 2
            expect(screen.getByText('Enter Content')).toBeInTheDocument();
        });
    });

    describe('Step 2: Content Input', () => {
        it('should show title input on step 2', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Next'));
            expect(screen.getByPlaceholderText('Title (optional)')).toBeInTheDocument();
        });

        it('should show text content input for text type', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Next'));
            expect(screen.getByPlaceholderText('Enter your content')).toBeInTheDocument();
        });

        it('should show image upload for image type', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Image'));
            await user.click(screen.getByText('Next'));
            expect(screen.getByTestId('image-upload-zone')).toBeInTheDocument();
        });

        it('should disable Next button when no content entered', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Next')); // Go to step 2
            const nextButton = screen.getByText('Next');
            expect(nextButton).toBeDisabled();
        });

        it('should enable Next button after entering content', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Next')); // Go to step 2
            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'My secret content');

            const nextButton = screen.getByText('Next');
            expect(nextButton).not.toBeDisabled();
        });

        it('should allow going back to step 1', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            await user.click(screen.getByText('Next')); // Go to step 2
            await user.click(screen.getByText('Back'));
            expect(screen.getByText('Choose Content Type')).toBeInTheDocument();
        });
    });

    describe('Step 3: Time Settings', () => {
        it('should show duration presets', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Navigate to step 3
            await user.click(screen.getByText('Next')); // Step 2
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Test');
            await user.click(screen.getByText('Next')); // Step 3

            expect(screen.getByText('Set Lock Duration')).toBeInTheDocument();
            expect(screen.getByText('1m')).toBeInTheDocument();
            expect(screen.getByText('1h')).toBeInTheDocument();
            expect(screen.getByText('1d')).toBeInTheDocument();
        });

        it('should show time mode toggle', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Navigate to step 3
            await user.click(screen.getByText('Next'));
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Test');
            await user.click(screen.getByText('Next'));

            expect(screen.getByText('Duration')).toBeInTheDocument();
            expect(screen.getByText('Custom Date')).toBeInTheDocument();
        });
    });

    describe('Step 4: Review & Submit', () => {
        it('should show review summary', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Navigate through all steps
            await user.click(screen.getByText('Next')); // Step 2
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Test content');
            await user.click(screen.getByText('Next')); // Step 3
            await user.click(screen.getByText('Next')); // Step 4

            expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
            expect(screen.getByText('Content Type')).toBeInTheDocument();
            expect(screen.getByText('Content Preview')).toBeInTheDocument();
        });

        it('should submit form and call onSubmit', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Navigate through all steps
            await user.click(screen.getByText('Next')); // Step 2
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Test content');
            await user.click(screen.getByText('Next')); // Step 3
            await user.click(screen.getByText('Next')); // Step 4

            // Submit
            await user.click(screen.getByText('Encrypt & Save'));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            });

            // Verify FormData content
            const formData = mockOnSubmit.mock.calls[0][0];
            expect(formData).toBeInstanceOf(FormData);
            expect(formData.get('type')).toBe('text');
            expect(formData.get('content')).toBe('Test content');
        });

        it('should call onClose after successful submission', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Navigate through all steps
            await user.click(screen.getByText('Next'));
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Test');
            await user.click(screen.getByText('Next'));
            await user.click(screen.getByText('Next'));

            await user.click(screen.getByText('Encrypt & Save'));

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });

    describe('Title Handling', () => {
        it('should include title in FormData when provided', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Step 1 -> Step 2
            await user.click(screen.getByText('Next'));

            // Enter title and content
            await user.type(screen.getByPlaceholderText('Title (optional)'), 'My Title');
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Content here');

            // Step 2 -> Step 3 -> Step 4
            await user.click(screen.getByText('Next'));
            await user.click(screen.getByText('Next'));

            // Submit
            await user.click(screen.getByText('Encrypt & Save'));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
            });

            const formData = mockOnSubmit.mock.calls[0][0];
            const metadata = formData.get('metadata');
            expect(metadata).toContain('My Title');
        });
    });
});
