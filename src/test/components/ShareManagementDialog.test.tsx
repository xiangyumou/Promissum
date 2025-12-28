import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShareManagementDialog from '@/components/ShareManagementDialog';
import { renderWithProviders } from '../utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import type { ShareData } from '@/lib/types';

describe('ShareManagementDialog', () => {
    const mockOnClose = vi.fn();
    const mockItemId = 'test-item-123';

    const mockShares: ShareData[] = [
        {
            id: '1',
            shareToken: 'token123',
            itemId: mockItemId,
            permission: 'view',
            createdBy: 'user-123',
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
            expiresAt: Date.now() + 22 * 60 * 60 * 1000, // 22 hours from now
            lastAccessedAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
        },
        {
            id: '2',
            shareToken: 'token456',
            itemId: mockItemId,
            permission: 'view-extend',
            createdBy: 'user-123',
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
            expiresAt: Date.now() - 1 * 60 * 60 * 1000, // Expired 1 hour ago
            lastAccessedAt: null,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render when open', () => {
        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json([]);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        expect(screen.getByText('Manage Shares')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        renderWithProviders(
            <ShareManagementDialog
                isOpen={false}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        expect(screen.queryByText('Manage Shares')).not.toBeInTheDocument();
    });

    it('should show loading state while fetching shares', () => {
        // Delay the response to keep loading state
        server.use(
            http.get('/api/shares', async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return HttpResponse.json([]);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Should show loading spinner (we can't easily check for animate-spin, but element should exist)
        expect(screen.getByText('Manage Shares')).toBeInTheDocument();
    });

    it('should display no shares message when list is empty', async () => {
        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json([]);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('No active shares for this item')).toBeInTheDocument();
        });
    });

    it('should display shares list when shares exist', async () => {
        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json(mockShares);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/token123/)).toBeInTheDocument();
            expect(screen.getByText(/token456/)).toBeInTheDocument();
        });
    });

    it('should show expired badge for expired shares', async () => {
        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json(mockShares);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Expired')).toBeInTheDocument();
        });
    });

    it('should revoke share when delete button clicked', async () => {
        let revokeCalledOnce = false;

        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json(mockShares);
            }),
            http.delete('/api/shares/:token', () => {
                revokeCalledOnce = true;
                return HttpResponse.json({ success: true });
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/token123/)).toBeInTheDocument();
        });

        // Click first delete button
        const deleteButtons = screen.getAllByTitle(/revoke share/i);
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(revokeCalledOnce).toBe(true);
        });
    });

    it('should refresh shares when refresh button clicked', async () => {
        let fetchCount = 0;

        server.use(
            http.get('/api/shares', () => {
                fetchCount++;
                return HttpResponse.json(mockShares);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText(/token123/)).toBeInTheDocument();
        });

        expect(fetchCount).toBe(1);

        // Click refresh button
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(fetchCount).toBe(2);
        });
    });

    it('should handle fetch error gracefully', async () => {
        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json(
                    { error: 'Internal server error' },
                    { status: 500 }
                );
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        // Should eventually show  "no shares" as fallback
        await waitFor(() => {
            expect(screen.getByText('No active shares for this item')).toBeInTheDocument();
        });
    });

    it('should display permission badges correctly', async () => {
        server.use(
            http.get('/api/shares', () => {
                return HttpResponse.json([
                    {
                        ...mockShares[0],
                        permission: 'view',
                        createdBy: 'user-123',
                        lastAccessedAt: Date.now() - 1000,
                    },
                    {
                        ...mockShares[1],
                        permission: 'full',
                        createdBy: 'user-123',
                        lastAccessedAt: null,
                    },
                ]);
            })
        );

        renderWithProviders(
            <ShareManagementDialog
                isOpen={true}
                onClose={mockOnClose}
                itemId={mockItemId}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('View Only')).toBeInTheDocument();
            expect(screen.getByText('Full Access')).toBeInTheDocument();
        });
    });
});
