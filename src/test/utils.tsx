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
        clearType: 'Clear type',
        presets: 'Presets',
        savePreset: 'Save Preset',
        loadPreset: 'Load Preset',
        presetName: 'Preset Name',
        presetNamePlaceholder: 'e.g. My Favorite Filter',
        deletePreset: 'Delete Preset',
        noPresets: 'No saved presets',
        quickFilters: 'Quick Filters',
        unlockingSoon: 'Unlocking Soon',
        unlockingSoonDesc: '< 24h',
        longLocked: 'Long-term Locked',
        longLockedDesc: '> 7 days',
        recentlyCreated: 'Recently Created',
        recentlyCreatedDesc: 'Last 24h',
        timeRange: 'Time Range',
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        customRange: 'Custom Range'
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
    ImageUpload: {
        dragDropHere: 'Drag and drop image here',
        dropHere: 'Drop image here',
        orClickToSelect: 'or click to select from your device',
        maxSize: 'Maximum size: {size}',
        fileTooLarge: 'File size exceeds 5MB limit',
        invalidFileType: 'Invalid file type. Please use PNG, JPG, GIF, or WEBP',
        pasteHint: 'You can also paste an image from clipboard (Ctrl/Cmd + V)'
    },
    Wizard: {
        step1Title: 'Choose Content Type',
        step2Title: 'Enter Your Content',
        step3Title: 'Set Time Lock',
        step4Title: 'Review & Confirm',
        stepProgress: 'Step {current} of {total}',
        selectContentType: 'What would you like to encrypt?',
        textNoteDesc: 'Encrypt text messages, notes, or secrets',
        imageDesc: 'Encrypt photos and images',
        textContent: 'Text Content',
        imageContent: 'Image Upload',
        nextStep: 'Next',
        previousStep: 'Back',
        reviewBeforeSubmit: 'Please review your settings before encrypting',
        contentType: 'Content Type',
        contentPreview: 'Content Preview'
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
    ApiStatus: {
        checking: 'Checking...',
        connected: 'Connected',
        disconnected: 'Disconnected',
        offline: 'Offline'
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
