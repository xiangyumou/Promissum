import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    route?: string;
}

export function renderWithProviders(
    ui: ReactElement,
    renderOptions: ExtendedRenderOptions = {}
) {
    return {
        user: undefined,
        ...render(ui, { wrapper: TestWrapper, ...renderOptions }),
    };
}

export function TestWrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function createWrapper() {
    return TestWrapper;
}

// Re-export everything
export * from '@testing-library/react';
