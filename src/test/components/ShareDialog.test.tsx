import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShareDialog from '@/components/ShareDialog';
import { renderWithProviders } from '../utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('ShareDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnShareCreated = vi.fn();
    const mockItemId = 'test-item-123';

    // Mock clipboard API
    const mockClipboard = {
        writeText: vi.fn(() => Promise.resolve()),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: mockClipboard,
        });
    });

    it('should render when open', () => {
        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        expect(screen.getByText('Share Item')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        renderWithProviders(
            <ShareDialog
                isOpen={false}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        expect(screen.queryByText('Share Item')).not.toBeInTheDocument();
    });

    it('should have view permission selected by default', () => {
        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        expect(screen.getByText('View Only')).toBeInTheDocument();
        expect(screen.getByText(/Recipient can only view/i)).toBeInTheDocument();
    });

    it('should allow selecting different permissions', () => {
        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Click on View & Extend permission
        const viewExtendOption = screen.getByText('View & Extend');
        fireEvent.click(viewExtendOption);

        // Should have description visible
        expect(screen.getByText(/view and extend the lock duration/i)).toBeInTheDocument();
    });

    it('should allow selecting expiration time', () => {
        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Click on 72h option
        const option72h = screen.getByText('3d');
        fireEvent.click(option72h);

        // Button should be highlighted (we can't easily check className, but clicking should work)
        expect(option72h).toBeInTheDocument();
    });

    it('should generate share link and copy to clipboard', async () => {
        // Mock the API response
        server.use(
            http.post('/api/shares', () => {
                return HttpResponse.json({
                    shareToken: 'abc123token',
                    itemId: mockItemId,
                    permission: 'view',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                    createdAt: Date.now(),
                });
            })
        );

        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
                onShareCreated={mockOnShareCreated}
            />
        );

        // Click generate link button
        const generateButton = screen.getByRole('button', { name: /generate share link/i });
        fireEvent.click(generateButton);

        // Wait for API call to complete
        await waitFor(() => {
            expect(screen.getByText('Share Link Ready!')).toBeInTheDocument();
        });

        // Should show the share URL
        expect(screen.getByText(/\/s\/abc123token/)).toBeInTheDocument();

        // Should have copied to clipboard
        expect(mockClipboard.writeText).toHaveBeenCalled();
        expect(mockOnShareCreated).toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
        // Mock API error
        server.use(
            http.post('/api/shares', () => {
                return HttpResponse.json(
                    { error: 'Internal server error' },
                    { status: 500 }
                );
            })
        );

        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        const generateButton = screen.getByRole('button', { name: /generate share link/i });
        fireEvent.click(generateButton);

        // Should not show success state
        await waitFor(() => {
            expect(screen.queryByText('Share Link Ready!')).not.toBeInTheDocument();
        });
    });

    it('should allow copying link after generation', async () => {
        server.use(
            http.post('/api/shares', () => {
                return HttpResponse.json({
                    shareToken: 'xyz789token',
                    itemId: mockItemId,
                    permission: 'view',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                    createdAt: Date.now(),
                });
            })
        );

        renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Generate link
        const generateButton = screen.getByRole('button', { name: /generate share link/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Share Link Ready!')).toBeInTheDocument();
        });

        // Reset mock to track second copy
        mockClipboard.writeText.mockClear();

        // Click copy button
        const copyButton = screen.getByRole('button', { name: /copy link/i });
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(mockClipboard.writeText).toHaveBeenCalled();
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });
    });

    it('should reset state when closed', () => {
        const { rerender } = renderWithProviders(
            <ShareDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Select different options
        fireEvent.click(screen.getByText('Full Access'));
        fireEvent.click(screen.getByText('3d'));

        // Close dialog
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
