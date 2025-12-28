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
        unlocked: 'Unlocked',
        locked: 'Locked',
        unlocksAt: 'Unlocks At'
    },
    Sidebar: {
        settings: 'Settings',
        noItems: 'No items found',
        collapseSidebar: 'Collapse Sidebar',
        filters: 'Filters',
        search: 'Search',
        clearSearch: 'Clear search',
        searchPlaceholder: 'Search...',
        clearStatus: 'Clear status',
        all: 'All',
        locked: 'Locked',
        unlocked: 'Unlocked',
        sortBy: 'Sort by',
        sortCreatedDesc: 'Newest',
        sortCreatedAsc: 'Oldest',
        sortDecryptDesc: 'Unlock soon',
        sortDecryptAsc: 'Unlock late',
        resetFilters: 'Reset filters',
        clearType: 'Clear type'
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
        extendLock: 'Extend Lock',
        selectItem: 'Select an item',
        decrypting: 'Decrypting...',
        notFound: 'Item not found',
        viewOriginal: 'View Original',
        minutes: 'minutes',
        hour: 'hour',
        hours: 'hours',
        addTime: 'Add time'
    },
    AddModal: {
        title: 'Add New Item',
        create: 'Create',
        text: 'Text',
        image: 'Image',
        duration: 'Duration',
        absoluteTime: 'Absolute Time',
        invalidTime: 'Invalid time',
        itemTitle: 'Item Title',
        titlePlaceholder: 'Title (optional)',
        enterContent: 'Write your thought...',
        changeImage: 'Change Image',
        uploadImage: 'Upload Image',
        uploadHint: 'Or paste image',
        lockDuration: 'Lock Duration',
        customDate: 'Custom Date',
        reset: 'Reset',
        checkInput: 'Check Input',
        unlocksAt: 'Unlocks At',
        remaining: 'Remaining',
        encrypting: 'Encrypting...',
        encryptAndSave: 'Encrypt & Save'
    },
    Theme: {
        light: 'Light',
        dark: 'Dark',
        system: 'System'
    },
    Settings: {
        exportDataTitle: 'Export Data',
        exportDataDesc: 'Export your data as JSON or Markdown.',
        exportJSON: 'JSON',
        exportMarkdown: 'Markdown'
    },
    Dashboard: {
        textNotes: 'Text Notes',
        images: 'Images',
        encrypted: 'Encrypted',
        unlocked: 'Unlocked',
        failedToLoad: 'Failed to load data',
        systemOverview: 'System Overview',
        totalItems: 'Total Items',
        contentTypeDistribution: 'Content Type Distribution',
        lockStatusDistribution: 'Lock Status Distribution',
        averageLockDuration: 'Average Lock Duration',
        basedOnHistory: 'Based on history',
        hours: 'hours'
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

    return {
        user: undefined, // userEvent.setup() can be added here if needed
        ...render(ui, { wrapper: TestWrapper, ...renderOptions }),
    };
}

export function TestWrapper({ children }: { children: React.ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <NextIntlClientProvider locale="en" messages={messages}>
                {children}
            </NextIntlClientProvider>
        </QueryClientProvider>
    );
}

export function createWrapper() {
    return TestWrapper;
}

// Re-export everything
export * from '@testing-library/react';
