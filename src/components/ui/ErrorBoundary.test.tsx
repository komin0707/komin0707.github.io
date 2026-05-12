import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function ThrowingChild(): ReactNode {
  throw new Error('forced render failure');
  return null;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    sessionStorage.clear();
    delete document.documentElement.dataset.errorTracking;
  });

  registerHealthyRenderTest();
  registerFallbackLoggingTests();
  registerRecoveryTest();
});

function registerHealthyRenderTest(): void {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>healthy simulator</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('healthy simulator')).toBeInTheDocument();
  });
}

function registerFallbackLoggingTests(): void {
  it('renders fallback UI and logs the render failure in development', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('시뮬레이터 화면을 불러오지 못했습니다');
    expect(sessionStorage.getItem('vent-errors')).toContain('"source":"r"');
    expect(consoleWarn).toHaveBeenCalledWith(
      'Simulator render failure',
      expect.any(Error),
      expect.stringContaining('ThrowingChild'),
    );

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('suppresses development warning logs outside dev mode', () => {
    vi.stubEnv('DEV', false);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('시뮬레이터 화면을 불러오지 못했습니다');
    expect(consoleWarn).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
}

function registerRecoveryTest(): void {
  it('recovers when the boundary is remounted after a render failure', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(
      <ErrorBoundary key="failed">
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <ErrorBoundary key="healthy">
        <p>recovered simulator</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('recovered simulator')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
}
