import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
    describe('cn (className merger)', () => {
        it('should merge class names correctly', () => {
            const result = cn('c1', 'c2');
            expect(result).toBe('c1 c2');
        });

        it('should handle conditional classes', () => {
            const result = cn(
                'base',
                true && 'visible',
                false && 'hidden',
                null,
                undefined
            );
            expect(result).toBe('base visible');
        });

        it('should resolve tailwind conflicts using tailwind-merge', () => {
            // p-4 overrides p-2
            const result = cn('p-2', 'p-4');
            expect(result).toBe('p-4');
        });

        it('should handle array inputs', () => {
            const result = cn(['c1', 'c2'], 'c3');
            expect(result).toBe('c1 c2 c3');
        });

        it('should handle deeply nested arrays', () => {
            const result = cn(['c1', ['c2', ['c3']]]);
            expect(result).toBe('c1 c2 c3');
        });

        it('should resolve mixed conflicts correctly', () => {
            // bg-red-500 should win over bg-blue-500
            // text-lg should win over text-sm
            const result = cn(
                'bg-blue-500 text-sm',
                'hover:bg-blue-600',
                'bg-red-500 text-lg'
            );
            expect(result).toBe('hover:bg-blue-600 bg-red-500 text-lg');
        });
    });
});
