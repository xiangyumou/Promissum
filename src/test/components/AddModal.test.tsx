import { waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import AddModal from '@/components/AddModal';
import { renderWithProviders } from '@/test/utils';

// Mock framer-motion to avoid animation delays
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: { children: React.ReactNode;[key: string]: unknown }) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: { children: React.ReactNode;[key: string]: unknown }) => <button {...props}>{children}</button>,
        }
    };
});

// Mock Modal to simplify testing
vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title: string }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal">
                <h1>{title}</h1>
                {children}
            </div>
        );
    }
}));

// Mock FileUploadZone
vi.mock('@/components/FileUploadZone', () => ({
    default: ({ files, onFilesChange }: { files: File[]; onFilesChange: (files: File[]) => void }) => (
        <div data-testid="file-upload-zone">
            <span>{files.length} files selected</span>
            <input
                type="file"
                data-testid="file-input"
                multiple
                onChange={(e) => onFilesChange(Array.from(e.target.files || []))}
            />
        </div>
    )
}));

// Mock next-intl - include NextIntlClientProvider for renderWithProviders
vi.mock('next-intl', async (importOriginal) => {
    const actual = await importOriginal() as object;
    return {
        ...actual,
        useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) => {
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
                    step1Title: 'Add Content',
                    step2Title: 'Set Lock Duration',
                    step3Title: 'Review & Confirm',
                    stepProgress: 'Step {current} of {total}',
                    addContentDesc: 'Add text, files, or both',
                    textContent: 'Text Content',
                    files: 'Files',
                    optional: 'optional',
                    contentType: 'Content Type',
                    contentPreview: 'Content Preview',
                    reviewBeforeSubmit: 'Review before submitting',
                    previousStep: 'Back',
                    nextStep: 'Next',
                    mixedContent: 'Mixed Content'
                },
                Common: {
                    text: 'Text',
                    textNote: 'Text Note',
                    image: 'Image',
                    file: 'File',
                    unlocksAt: 'Unlocks at',
                    untitled: 'Untitled'
                }
            };
            let result = translations[namespace]?.[key] || key;
            // Replace params
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    result = result.replace(`{${k}}`, String(v));
                });
            }
            return result;
        }
    };
});

describe('AddModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
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
            expect(screen.getByText('Add Content')).toBeInTheDocument();
            // Step progress
            expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
        });
    });

    describe('Step 1: Content Input', () => {
        it('should show content input fields', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByPlaceholderText('Title (optional)')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter your content')).toBeInTheDocument();
            expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument();
        });

        it('should disable Next button when no content entered', () => {
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const nextButton = screen.getByText('Next');
            expect(nextButton).toBeDisabled();
        });

        it('should enable Next button after entering text content', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AddModal
                    isOpen={true}
                    defaultDuration={60}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'My secret content');

            const nextButton = screen.getByText('Next');
            expect(nextButton).not.toBeDisabled();
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

            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'Test content');
            await user.click(screen.getByText('Next'));

            expect(screen.getByText('Set Lock Duration')).toBeInTheDocument();
        });
    });

    describe('Step 2: Time Settings', () => {
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

            // Navigate to step 2
            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'Test');
            await user.click(screen.getByText('Next'));

            expect(screen.getByText('Set Lock Duration')).toBeInTheDocument();
            expect(screen.getByText('Duration')).toBeInTheDocument();
            expect(screen.getByText('Custom Date')).toBeInTheDocument();
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

            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'Test');
            await user.click(screen.getByText('Next'));
            await user.click(screen.getByText('Back'));

            expect(screen.getByText('Add Content')).toBeInTheDocument();
        });
    });

    describe('Step 3: Review & Submit', () => {
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
            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'Test content');
            await user.click(screen.getByText('Next')); // Step 2
            await user.click(screen.getByText('Next')); // Step 3

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
            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'Test content');
            await user.click(screen.getByText('Next')); // Step 2
            await user.click(screen.getByText('Next')); // Step 3

            // Submit
            await user.click(screen.getByText('Encrypt & Save'));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            });

            // Verify FormData content
            const formData = mockOnSubmit.mock.calls[0][0];
            expect(formData).toBeInstanceOf(FormData);
            expect(formData.get('text')).toBe('Test content');
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
            const textarea = screen.getByPlaceholderText('Enter your content');
            await user.type(textarea, 'Test');
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

            // Enter title and content on step 1
            await user.type(screen.getByPlaceholderText('Title (optional)'), 'My Title');
            await user.type(screen.getByPlaceholderText('Enter your content'), 'Content here');

            // Navigate to step 3
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
