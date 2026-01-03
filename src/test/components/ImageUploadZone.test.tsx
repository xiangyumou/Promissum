import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageUploadZone from '@/components/ImageUploadZone';
import { renderWithProviders } from '../utils';

// Create a mock file
const createMockFile = (name: string, size: number, type: string) => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

describe('ImageUploadZone', () => {
    const mockOnFileChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render upload prompt when no file', () => {
        renderWithProviders(
            <ImageUploadZone file={null} onFileChange={mockOnFileChange} />
        );

        expect(screen.getByText(/drag and drop image here/i)).toBeInTheDocument();
        expect(screen.getByText(/or click to select/i)).toBeInTheDocument();
    });

    it('should show file info when file is selected', () => {
        const mockFile = createMockFile('test.png', 1024 * 100, 'image/png');

        renderWithProviders(
            <ImageUploadZone file={mockFile} onFileChange={mockOnFileChange} />
        );

        expect(screen.getByText('test.png')).toBeInTheDocument();
        expect(screen.getByText(/100\.0 KB/i)).toBeInTheDocument();
    });

    it('should call onFileChange when file is selected via click', async () => {
        renderWithProviders(
            <ImageUploadZone file={null} onFileChange={mockOnFileChange} />
        );

        const file = createMockFile('photo.jpg', 1024 * 500, 'image/jpeg');
        const input = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement;

        Object.defineProperty(input, 'files', {
            value: [file]
        });

        fireEvent.change(input);

        await waitFor(() => {
            expect(mockOnFileChange).toHaveBeenCalledWith(file);
        });
    });

    it('should call onFileChange with null when remove button clicked', () => {
        const mockFile = createMockFile('test.png', 1024 * 100, 'image/png');

        renderWithProviders(
            <ImageUploadZone file={mockFile} onFileChange={mockOnFileChange} />
        );

        const removeButton = screen.getByLabelText(/delete/i);
        fireEvent.click(removeButton);

        expect(mockOnFileChange).toHaveBeenCalledWith(null);
    });

    it('should not show remove button when disabled', () => {
        const mockFile = createMockFile('test.png', 1024 * 100, 'image/png');

        renderWithProviders(
            <ImageUploadZone
                file={mockFile}
                onFileChange={mockOnFileChange}
                disabled={true}
            />
        );

        expect(screen.queryByLabelText(/delete/i)).not.toBeInTheDocument();
    });

    it('should show error message for file too large', async () => {
        renderWithProviders(
            <ImageUploadZone file={null} onFileChange={mockOnFileChange} />
        );

        // Create file larger than 5MB
        const largeFile = createMockFile('large.png', 6 * 1024 * 1024, 'image/png');
        const input = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement;

        Object.defineProperty(input, 'files', {
            value: [largeFile]
        });

        fireEvent.change(input);

        await waitFor(() => {
            expect(screen.getByText(/file size exceeds 5MB limit/i)).toBeInTheDocument();
        });
    });

    it('should show error message for invalid file type', async () => {
        renderWithProviders(
            <ImageUploadZone file={null} onFileChange={mockOnFileChange} />
        );

        // Create invalid file type
        const invalidFile = createMockFile('document.pdf', 1024 * 100, 'application/pdf');
        const input = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement;

        Object.defineProperty(input, 'files', {
            value: [invalidFile]
        });

        fireEvent.change(input);

        await waitFor(() => {
            expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
        });
    });

    it('should show drag active state', async () => {
        const { container } = renderWithProviders(
            <ImageUploadZone file={null} onFileChange={mockOnFileChange} />
        );

        const dropzone = container.querySelector('[role="presentation"]') as HTMLElement;

        // Create a complete DataTransfer mock
        const mockFile = createMockFile('test.png', 1024, 'image/png');
        const dataTransfer = {
            dropEffect: 'none',
            effectAllowed: 'all',
            files: [mockFile] as unknown as FileList,
            items: {
                length: 1,
                0: { kind: 'file', type: 'image/png' },
            } as unknown as DataTransferItemList,
            types: ['Files'],
            getData: () => '',
            setData: () => { },
            clearData: () => { },
            setDragImage: () => { },
        };

        // Simulate drag enter
        fireEvent.dragEnter(dropzone, { dataTransfer });

        await waitFor(() => {
            expect(screen.getByText(/drop image here/i)).toBeInTheDocument();
        });
    });

    it('should accept multiple valid image formats', () => {
        renderWithProviders(
            <ImageUploadZone file={null} onFileChange={mockOnFileChange} />
        );

        const input = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement;

        // Check that input accepts correct types
        expect(input).toHaveAttribute('accept');
        const accept = input.getAttribute('accept');
        expect(accept).toContain('image/png');
        expect(accept).toContain('image/jpeg');
        expect(accept).toContain('image/gif');
        expect(accept).toContain('image/webp');
    });
});
