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
});
