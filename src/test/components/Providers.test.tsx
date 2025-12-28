import { describe, it, expect, vi } from 'vitest';
import { screen, render } from '@testing-library/react';
import { Providers } from '@/components/Providers';
import { initializeQueryPersistence } from '@/lib/cache-config';

// Mock dependencies
vi.mock('@/lib/query-client', () => ({
    queryClient: {
        mount: vi.fn(),
        defaultOptions: { queries: { retry: false } }
    }
}));

// Mock initializeQueryPersistence
vi.mock('@/lib/cache-config', () => ({
    initializeQueryPersistence: vi.fn()
}));

vi.mock('@tanstack/react-query', () => ({
    QueryClientProvider: ({ children }: any) => <div data-testid="query-client-provider">{children}</div>
}));
vi.mock('@tanstack/react-query-devtools', () => ({
    ReactQueryDevtools: () => <div data-testid="devtools" />
}));
vi.mock('next-themes', () => ({
    ThemeProvider: ({ children }: any) => <div data-testid="theme-provider">{children}</div>,
    useTheme: () => ({ theme: 'system' })
}));
vi.mock('sonner', () => ({
    Toaster: () => <div data-testid="toaster" />
}));
// Mock internal components that might have complex dependencies
vi.mock('@/components/SecurityProvider', () => ({
    default: () => <div data-testid="security-provider" />
}));
vi.mock('@/components/ThemeRegistry', () => ({
    default: () => <div data-testid="theme-registry" />
}));

describe('Providers', () => {
    it('should render children wrapped in providers', () => {
        render(
            <Providers>
                <div data-testid="child">Child Content</div>
            </Providers>
        );

        // Check nesting structure
        const queryProvider = screen.getByTestId('query-client-provider');
        const themeProvider = screen.getByTestId('theme-provider');
        const securityProvider = screen.getByTestId('security-provider');
        const themeRegistry = screen.getByTestId('theme-registry');
        const child = screen.getByTestId('child');
        const toaster = screen.getByTestId('toaster');

        expect(queryProvider).toContainElement(themeProvider);
        expect(themeProvider).toContainElement(securityProvider);
        expect(themeProvider).toContainElement(themeRegistry);
        expect(themeProvider).toContainElement(child);
        expect(themeProvider).toContainElement(toaster);
    });

    it('should initialize cache persistence', () => {
        render(
            <Providers>
                <div>Child</div>
            </Providers>
        );

        expect(initializeQueryPersistence).toHaveBeenCalled();
    });
});
