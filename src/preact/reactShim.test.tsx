/** @jsxImportSource preact */
import { render, type JSX } from 'preact';
import { waitFor } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { createRoot } from './reactDomClientShim';
import { lazy, memo, Suspense, useDeferredValue, useTransition } from './reactShim';

function flushPromises(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe('production preact react shims', () => {
  registerRootShimTests();
  registerCompatibilityHelperTests();
  registerSvgAttributeAliasTests();
  registerLazyComponentTests();
});

function registerRootShimTests(): void {
  it('renders and unmounts through the createRoot shim', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    root.render(<span>Root rendered</span>);
    expect(container).toHaveTextContent('Root rendered');

    root.unmount();
    expect(container).toBeEmptyDOMElement();
  });
}

function registerCompatibilityHelperTests(): void {
  it('keeps lightweight react compatibility helpers functional', () => {
    const Component = ({ label }: { label: string }) => <span>{label}</span>;
    const MemoComponent = memo(Component);
    const [isPending, startTransition] = useTransition();
    let transitioned = false;

    startTransition(() => {
      transitioned = true;
    });

    expect(MemoComponent).toBe(Component);
    expect(Suspense({ children: 'content' })).toBe('content');
    expect(useDeferredValue('metric')).toBe('metric');
    expect(isPending).toBe(false);
    expect(transitioned).toBe(true);
  });
}

function registerSvgAttributeAliasTests(): void {
  it('normalizes React SVG attribute names for Preact DOM output', () => {
    const container = document.createElement('div');
    render(
      <svg>
        <path className="shape" strokeLinecap="round" strokeOpacity={0.12} strokeWidth={3} />
        <text dominantBaseline="middle" textAnchor="middle">
          Label
        </text>
      </svg>,
      container,
    );

    expect(container.querySelector('.shape')).toHaveAttribute('stroke-linecap', 'round');
    expect(container.querySelector('.shape')).toHaveAttribute('stroke-opacity', '0.12');
    expect(container.querySelector('.shape')).toHaveAttribute('stroke-width', '3');
    expect(container.querySelector('text')).toHaveAttribute('dominant-baseline', 'middle');
    expect(container.querySelector('text')).toHaveAttribute('text-anchor', 'middle');
  });

  it('normalizes compact production DOM prop names for Preact output', () => {
    const container = document.createElement('div');
    const compactProps = {
      _A: 'compact-node',
      _B: 'Compact patient marker',
      _q: 'compact-marker',
      _r: 'Compact child',
      _z: 'img',
    } as unknown as JSX.HTMLAttributes<HTMLDivElement>;

    render(<div {...compactProps} />, container);

    const compactNode = container.querySelector('.compact-marker');
    expect(compactNode).toHaveAttribute('aria-label', 'Compact patient marker');
    expect(compactNode).toHaveAttribute('data-testid', 'compact-node');
    expect(compactNode).toHaveAttribute('role', 'img');
    expect(compactNode).toHaveTextContent('Compact child');
  });
}

function registerLazyComponentTests(): void {
  it('loads lazy components and rerenders after the module resolves', async () => {
    const LazyComponent = lazy(() =>
      Promise.resolve({
        default: ({ label }: { label: string }) => <strong>{label}</strong>,
      }),
    );
    const container = document.createElement('div');

    render(<LazyComponent label="Loaded avatar" />, container);
    expect(container).toBeEmptyDOMElement();

    await flushPromises();
    await waitFor(() => expect(container).toHaveTextContent('Loaded avatar'));

    render(<LazyComponent label="Cached avatar" />, container);
    expect(container).toHaveTextContent('Cached avatar');

    const secondContainer = document.createElement('div');
    render(<LazyComponent label="Already loaded avatar" />, secondContainer);
    expect(secondContainer).toHaveTextContent('Already loaded avatar');
    await flushPromises();
  });
}
