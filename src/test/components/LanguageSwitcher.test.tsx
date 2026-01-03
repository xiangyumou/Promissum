import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { renderWithProviders } from '@/test/utils';

// Mock the i18n routing
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('@/i18n/routing', () => ({
    usePathname: () => '/test-path',
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace
    })
}));

// Mock next-intl
vi.mock('next-intl', async () => {
    const actual = await vi.importActual('next-intl');
    return {
        ...actual,
        useLocale: vi.fn(() => 'en')
    };
});

import { useLocale } from 'next-intl';

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the language switcher button', () => {
            renderWithProviders(<LanguageSwitcher />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('title', 'Switch Language');
        });

        it('should show Chinese text when current locale is English', () => {
            vi.mocked(useLocale).mockReturnValue('en');

            renderWithProviders(<LanguageSwitcher />);

            expect(screen.getByText('中文')).toBeInTheDocument();
        });

        it('should show English text when current locale is Chinese', () => {
            vi.mocked(useLocale).mockReturnValue('zh');

            renderWithProviders(<LanguageSwitcher />);

            expect(screen.getByText('English')).toBeInTheDocument();
        });
    });

    describe('Language Switching', () => {
        it('should call router.replace with zh locale when switching from English', () => {
            vi.mocked(useLocale).mockReturnValue('en');

            renderWithProviders(<LanguageSwitcher />);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            // The replace should be called with the new locale
            expect(mockReplace).toHaveBeenCalledWith('/test-path', { locale: 'zh' });
        });

        it('should call router.replace with en locale when switching from Chinese', () => {
            vi.mocked(useLocale).mockReturnValue('zh');

            renderWithProviders(<LanguageSwitcher />);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(mockReplace).toHaveBeenCalledWith('/test-path', { locale: 'en' });
        });
    });

    describe('Button State', () => {
        it('should have correct styling classes', () => {
            renderWithProviders(<LanguageSwitcher />);

            const button = screen.getByRole('button');
            expect(button.className).toContain('flex');
            expect(button.className).toContain('items-center');
        });
    });
});
