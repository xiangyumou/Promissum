import { describe, it, expect } from 'vitest';
import {
    FilterParamsSchema,
    CreateItemSchema,
    ExtendItemSchema,
    ItemIdSchema,
    parseFormDataToObject,
    formatZodErrors
} from '@/lib/validation';
import { z } from 'zod';

describe('validation', () => {
    describe('FilterParamsSchema', () => {
        it('should validate valid params', () => {
            const result = FilterParamsSchema.safeParse({
                status: 'locked',
                type: 'text',
                sort: 'created_desc',
                limit: 10,
                offset: 0
            });
            expect(result.success).toBe(true);
        });

        it('should allow optional params', () => {
            const result = FilterParamsSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should coerce numbers', () => {
            const result = FilterParamsSchema.safeParse({
                limit: '10',
                offset: '0'
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBe(10);
                expect(result.data.offset).toBe(0);
            }
        });
    });

    describe('CreateItemSchema', () => {
        it('should validate valid text item', () => {
            const result = CreateItemSchema.safeParse({
                type: 'text',
                content: 'hello',
                durationMinutes: 60
            });
            expect(result.success).toBe(true);
        });

        it('should fail if missing duration AND decryptAt', () => {
            const result = CreateItemSchema.safeParse({
                type: 'text',
                content: 'hello'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Either durationMinutes or decryptAt must be provided');
            }
        });

        it('should validate valid image item', () => {
            const result = CreateItemSchema.safeParse({
                type: 'image',
                content: 'base64string',
                decryptAt: Date.now() + 10000
            });
            expect(result.success).toBe(true);
        });
    });

    describe('ExtendItemSchema', () => {
        it('should validate positive minutes', () => {
            const result = ExtendItemSchema.safeParse({ minutes: 60 });
            expect(result.success).toBe(true);
        });

        it('should fail for negative minutes', () => {
            const result = ExtendItemSchema.safeParse({ minutes: -10 });
            expect(result.success).toBe(false);
        });
    });

    describe('ItemIdSchema', () => {
        it('should validate string id', () => {
            const result = ItemIdSchema.safeParse('123');
            expect(result.success).toBe(true);
        });

        it('should fail for empty string', () => {
            const result = ItemIdSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('parseFormDataToObject', () => {
        it('should parse basic fields', () => {
            const fd = new FormData();
            fd.append('key', 'value');
            const res = parseFormDataToObject(fd);
            expect(res).toEqual({ key: 'value' });
        });

        it('should parse numbers', () => {
            const fd = new FormData();
            fd.append('durationMinutes', '60');
            const res = parseFormDataToObject(fd);
            expect(res).toEqual({ durationMinutes: 60 });
        });

        it('should parse metadata JSON', () => {
            const fd = new FormData();
            fd.append('metadata', '{"foo":"bar"}');
            const res = parseFormDataToObject(fd);
            expect(res).toEqual({ metadata: { foo: 'bar' } });
        });

        // JSDOM FormData usually treats files as Objects or Blob/File instances
        it('should pass through files', () => {
            const fd = new FormData();
            const file = new File([''], 'test.png', { type: 'image/png' });
            fd.append('file', file);
            const res = parseFormDataToObject(fd);
            // We can't strictly compare File object equality easily, but it should be there
            expect(res.file).toBeInstanceOf(File);
        });
    });

    describe('formatZodErrors', () => {
        it('should format errors string', () => {
            const schema = z.object({ foo: z.string() });
            const result = schema.safeParse({ foo: 123 });
            if (!result.success) {
                const msg = formatZodErrors(result.error);
                expect(msg).toContain('foo');
                // Case insensitive check or just lower case
                expect(msg.toLowerCase()).toContain('expected string, received number');
            }
        });
    });

    describe('Edge Cases', () => {
        it('should accept valid content with duration', () => {
            const result = CreateItemSchema.safeParse({
                type: 'text',
                content: 'valid content',
                durationMinutes: 60
            });
            expect(result.success).toBe(true);
        });

        it('should handle empty form data in parseFormDataToObject', () => {
            const formData = new FormData();
            expect(parseFormDataToObject(formData)).toEqual({});
        });

        it('should handle empty error array in formatZodErrors', () => {
            // Create minimal ZodError-like structure
            const mockError = { issues: [] } as unknown as z.ZodError;
            const result = formatZodErrors(mockError);
            expect(result).toBe(''); // Empty issues array returns empty string
        });
    });
});
