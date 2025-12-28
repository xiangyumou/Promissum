import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { migrateLocalStorage, resetMigration } from '@/lib/migrate-localstorage';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock getDeviceId
vi.mock('@/lib/device-id', () => ({
    getDeviceId: vi.fn().mockResolvedValue('device-123'),
}));

describe('LocalStorage Migration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        resetMigration();
    });

    // Handlers are automatically reset by setup.ts afterEach

    it('should return true if migration already complete', async () => {
        localStorage.setItem('promissum_settings_migrated', 'true');
        // Spy on fetch to ensure it's NOT called, but we can't easily spy on valid fetch calls with MSW active 
        // without inspecting MSW events or using a spy on window.fetch BEFORE MSW patches it.
        // However, if we don't define a handler, MSW will error if a request is made (due to onUnhandledRequest: 'error').
        // So if this test passes without error, it means no request was made.

        const result = await migrateLocalStorage();
        expect(result).toBe(true);
    });

    it('should skip if no settings in localStorage', async () => {
        const result = await migrateLocalStorage();
        expect(result).toBe(true); // Treated as success
        expect(localStorage.getItem('promissum_settings_migrated')).toBe('true');
    });

    it('should migrate settings and mark as complete', async () => {
        const mockSettings = {
            state: {
                defaultDurationMinutes: 60,
                themeConfig: { color: 'blue' },
            },
        };
        localStorage.setItem('chaster-settings', JSON.stringify(mockSettings));

        // Intercept the specific POST request
        let requestBody: any;
        server.use(
            http.post('/api/preferences', async ({ request }) => {
                requestBody = await request.json();
                return HttpResponse.json({ success: true });
            })
        );

        const result = await migrateLocalStorage();

        expect(result).toBe(true);
        expect(localStorage.getItem('promissum_settings_migrated')).toBe('true');

        // Verify payload
        expect(requestBody).toEqual(expect.objectContaining({
            deviceId: 'device-123',
            defaultDurationMinutes: 60,
            themeConfig: '{"color":"blue"}',
        }));
    });

    it('should handle API failure gracefully', async () => {
        const mockSettings = { state: { defaultDurationMinutes: 60 } };
        localStorage.setItem('chaster-settings', JSON.stringify(mockSettings));

        // Simulate error
        server.use(
            http.post('/api/preferences', () => {
                return new HttpResponse(null, { status: 500, statusText: 'Server Error' });
            })
        );

        const result = await migrateLocalStorage();

        expect(result).toBe(false);
        expect(localStorage.getItem('promissum_settings_migrated')).toBeNull(); // Should not mark as complete
    });
});
