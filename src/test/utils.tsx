import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { resetSettingsStore } from '@/lib/stores/settings-store';
import { vi } from 'vitest';

// Mock generic messages for testing
const messages = {
    Common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        newEntry: 'New Entry',
        textNote: 'Text Note',
        image: 'Image',
        unlocked: 'Unlocked'
    },
    Sidebar: {
        settings: 'Settings',
        noItems: 'No items found',
        collapseSidebar: 'Collapse Sidebar'
    },
    ContentView: {
        delete: 'Delete',
        extend: 'Extend',
        decrypt: 'Decrypt',
        confirmDelete: 'Are you sure you want to delete this item?',
        confirmExtend: 'Extend lock by {minutes} minutes?',
        confirmExtendDesc: 'This will add {minutes} minutes to the lock duration.',
        contentEncrypted: 'Content Encrypted',
        timeLockActive: 'Time Lock Active',
        unlocksIn: 'Unlocks in',
        extendLock: 'Extend Lock'
    },
    AddModal: {
        title: 'Add New Item',
        create: 'Create',
        text: 'Text',
        image: 'Image',
        duration: 'Duration',
        absoluteTime: 'Absolute Time',
        invalidTime: 'Invalid time'
    }
};

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            gcTime: 0,
            staleTime: 0,
        },
    },
});

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    route?: string;
}

export function renderWithProviders(
    ui: ReactElement,
    { route = '/', ...renderOptions }: ExtendedRenderOptions = {}
) {
    // Reset store before each render
    resetSettingsStore();

    const queryClient = createTestQueryClient();

    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <NextIntlClientProvider locale="en" messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </QueryClientProvider>
        );
    }

    return {
        user: undefined, // userEvent.setup() can be added here if needed
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    };
}

// Re-export everything
export * from '@testing-library/react';
