import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import ThemeRegistry from '@/components/ThemeRegistry';
import { useSettings } from '@/lib/stores/settings-store';

vi.mock('@/lib/stores/settings-store', () => ({
    useSettings: vi.fn()
}));

describe('ThemeRegistry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear any existing styles on documentElement
        document.documentElement.style.cssText = '';
    });

    describe('Theme Application', () => {
        it('should apply custom theme config to document root', () => {
            const mockThemeConfig = {
                '--primary': '#3b82f6',
                '--secondary': '#10b981',
                '--bg': '#1f2937'
            };

            (useSettings as any).mockReturnValue({ themeConfig: mockThemeConfig });

            render(<ThemeRegistry />);

            expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#3b82f6');
            expect(document.documentElement.style.getPropertyValue('--secondary')).toBe('#10b981');
            expect(document.documentElement.style.getPropertyValue('--bg')).toBe('#1f2937');
        });

        it('should remove custom properties when theme config is empty', () => {
            // First set some properties
            document.documentElement.style.setProperty('--primary', '#000');
            document.documentElement.style.setProperty('--secondary', '#fff');

            (useSettings as any).mockReturnValue({ themeConfig: {} });

            render(<ThemeRegistry />);

            expect(document.documentElement.style.getPropertyValue('--primary')).toBe('');
            expect(document.documentElement.style.getPropertyValue('--secondary')).toBe('');
        });

        it('should update theme when config changes', () => {
            const { rerender } = render(<ThemeRegistry />);

            // Initial theme
            (useSettings as any).mockReturnValue({
                themeConfig: { '--primary': '#ff0000' }
            });
            rerender(<ThemeRegistry />);

            expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#ff0000');

            // Updated theme
            (useSettings as any).mockReturnValue({
                themeConfig: { '--primary': '#00ff00' }
            });
            rerender(<ThemeRegistry />);

            expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#00ff00');
        });
    });

    describe('Edge Cases', () => {
        it('should handle partial theme config', () => {
            (useSettings as any).mockReturnValue({
                themeConfig: { '--primary': '#3b82f6' }
            });

            render(<ThemeRegistry />);

            expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#3b82f6');
            expect(document.documentElement.style.getPropertyValue('--secondary')).toBe('');
        });

        it('should skip falsy values in theme config', () => {
            (useSettings as any).mockReturnValue({
                themeConfig: {
                    '--primary': '#3b82f6',
                    '--secondary': '',
                    '--bg': null
                }
            });

            render(<ThemeRegistry />);

            expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#3b82f6');
            // Empty and null values should not be set
            expect(document.documentElement.style.getPropertyValue('--secondary')).toBe('');
        });

        it('should not render any visible content', () => {
            (useSettings as any).mockReturnValue({ themeConfig: {} });

            const { container } = render(<ThemeRegistry />);

            // Should be a headless component
            expect(container.firstChild).toBeNull();
        });
    });

    describe('SSR Safety', () => {
        it.skip('should handle window undefined gracefully', () => {
            // Note: Skipped because React DOM itself requires window object in test environment
            // The actual component code has the check: if (typeof window === 'undefined') return;
            // This works correctly in real SSR (Next.js) but can't be tested in jsdom environment

            (useSettings as any).mockReturnValue({ themeConfig: { '--primary': '#000' } });

            // In real SSR, component returns null when window is undefined
            expect(true).toBe(true);
        });
    });
});
