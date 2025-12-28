import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
    describe('Rendering', () => {
        it('should render with default styles', () => {
            const { container } = render(<Skeleton />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toBeInTheDocument();
            expect(skeleton).toHaveClass('animate-pulse');
            expect(skeleton).toHaveClass('rounded-md');
            expect(skeleton).toHaveClass('bg-white/10');
        });

        it('should merge custom className', () => {
            const { container } = render(<Skeleton className="w-full h-20" />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveClass('animate-pulse');
            expect(skeleton).toHaveClass('rounded-md');
            expect(skeleton).toHaveClass('bg-white/10');
            expect(skeleton).toHaveClass('w-full');
            expect(skeleton).toHaveClass('h-20');
        });

        it('should override default classes with custom ones', () => {
            const { container } = render(<Skeleton className="rounded-full bg-gray-500" />);
            const skeleton = container.firstChild as HTMLElement;

            // Should still have animation
            expect(skeleton).toHaveClass('animate-pulse');
            // Custom classes should be applied
            expect(skeleton).toHaveClass('rounded-full');
            expect(skeleton).toHaveClass('bg-gray-500');
        });
    });

    describe('Props', () => {
        it('should pass through other HTML attributes', () => {
            const { container } = render(
                <Skeleton data-testid="custom-skeleton" aria-label="Loading" />
            );
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveAttribute('data-testid', 'custom-skeleton');
            expect(skeleton).toHaveAttribute('aria-label', 'Loading');
        });

        it('should accept style prop', () => {
            const { container } = render(<Skeleton style={{ width: '200px', height: '50px' }} />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
        });

        it('should accept id prop', () => {
            const { container } = render(<Skeleton id="my-skeleton" />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveAttribute('id', 'my-skeleton');
        });
    });

    describe('Common Use Cases', () => {
        it('should render as avatar skeleton', () => {
            const { container } = render(<Skeleton className="h-12 w-12 rounded-full" />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveClass('h-12');
            expect(skeleton).toHaveClass('w-12');
            expect(skeleton).toHaveClass('rounded-full');
        });

        it('should render as text line skeleton', () => {
            const { container } = render(<Skeleton className="h-4 w-[250px]" />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveClass('h-4');
            expect(skeleton).toHaveClass('w-[250px]');
        });

        it('should render multiple skeletons for card', () => {
            const { container } = render(
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            );

            const skeletons = container.querySelectorAll('.animate-pulse');
            expect(skeletons).toHaveLength(2);
        });
    });
});
