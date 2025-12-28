import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '@/components/Dashboard';
import { renderWithProviders } from '@/test/utils';

// Mock useStats
vi.mock('@/lib/queries', () => ({
    useStats: vi.fn()
}));

// Mock recharts to avoid complex SVG rendering in test
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div>{children}</div>,
    Cell: () => <div />,
    Tooltip: () => <div />
}));

// Mock next-intl routing
vi.mock('@/i18n/routing', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}));

import { useStats } from '@/lib/queries';

describe('Dashboard', () => {
    it('should show loading state', () => {
        (useStats as any).mockReturnValue({ isLoading: true });
        renderWithProviders(<Dashboard />);
        // Dashboard doesn't have explicit "Loading..." text in skeleton or it uses spinner?
        // Dashboard.tsx:29: loading spinner div.
        // It doesn't have text.
        // But renderWithProviders returns simple render.
        // We can check for a specific class or check queryByText('System Overview') is null.
        expect(screen.queryByText('System Overview')).not.toBeInTheDocument();
    });

    it('should show error state', () => {
        (useStats as any).mockReturnValue({ isLoading: false, error: true });
        renderWithProviders(<Dashboard />);
        // "failedToLoad" key -> Dashboard.failedToLoad
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should render stats and charts', () => {
        (useStats as any).mockReturnValue({
            isLoading: false,
            data: {
                totalItems: 10,
                lockedItems: 5,
                unlockedItems: 5,
                byType: { text: 5, image: 5 },
                avgLockDurationMinutes: 120
            }
        });

        renderWithProviders(<Dashboard />);

        expect(screen.getByText('System Overview')).toBeInTheDocument();
        expect(screen.getAllByText('10')).toHaveLength(1); // total items
        expect(screen.getAllByText('5').length).toBeGreaterThan(1); // locked/unlocked/types

        // Check avg duration: 120min = 2 hours
        // Dashboard: Math.round(120 / 60) -> 2
        // Text: 2 hours
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('hours')).toBeInTheDocument(); // Common.hours
    });

    describe('Edge Cases', () => {
        it('should handle zero items gracefully', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 0,
                    lockedItems: 0,
                    unlockedItems: 0,
                    byType: { text: 0, image: 0 },
                    avgLockDurationMinutes: 0
                }
            });

            renderWithProviders(<Dashboard />);

            expect(screen.getByText('System Overview')).toBeInTheDocument();
            // Should show 0 values
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        });

        it('should handle all locked items', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 100,
                    lockedItems: 100,
                    unlockedItems: 0,
                    byType: { text: 50, image: 50 },
                    avgLockDurationMinutes: 60
                }
            });

            renderWithProviders(<Dashboard />);

            // 100 appears in totalItems and lockedItems
            expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(1);
        });

        it('should handle all unlocked items', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 50,
                    lockedItems: 0,
                    unlockedItems: 50,
                    byType: { text: 25, image: 25 },
                    avgLockDurationMinutes: 180
                }
            });

            renderWithProviders(<Dashboard />);

            // 50 appears multiple times (totalItems, unlockedItems, chart legends)
            expect(screen.getAllByText('50').length).toBeGreaterThanOrEqual(1);
            // 180 / 60 = 3 hours
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('should handle large numbers', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 9999,
                    lockedItems: 5000,
                    unlockedItems: 4999,
                    byType: { text: 6000, image: 3999 },
                    avgLockDurationMinutes: 10080 // 168 hours (1 week)
                }
            });

            renderWithProviders(<Dashboard />);

            expect(screen.getByText('9999')).toBeInTheDocument();
            expect(screen.getByText('168')).toBeInTheDocument(); // hours
        });

        it('should handle missing avgLockDurationMinutes', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 5,
                    lockedItems: 2,
                    unlockedItems: 3,
                    byType: { text: 3, image: 2 }
                    // avgLockDurationMinutes is undefined
                }
            });

            renderWithProviders(<Dashboard />);

            expect(screen.getByText('System Overview')).toBeInTheDocument();
            // Should not show Average Lock Duration section
            expect(screen.queryByText('Average Lock Duration')).not.toBeInTheDocument();
        });

        it('should handle only text items', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 10,
                    lockedItems: 5,
                    unlockedItems: 5,
                    byType: { text: 10, image: 0 },
                    avgLockDurationMinutes: 60
                }
            });

            renderWithProviders(<Dashboard />);

            // 10 appears in totalItems and text count
            expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
        });

        it('should handle only image items', () => {
            (useStats as any).mockReturnValue({
                isLoading: false,
                data: {
                    totalItems: 10,
                    lockedItems: 5,
                    unlockedItems: 5,
                    byType: { text: 0, image: 10 },
                    avgLockDurationMinutes: 60
                }
            });

            renderWithProviders(<Dashboard />);

            // 10 appears in totalItems and image count
            expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
        });
    });
});

