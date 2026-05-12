import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportApplicationError } from '@/lib';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportApplicationError(error, 'r');

    if (import.meta.env.DEV) {
      console.warn('Simulator render failure', error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="simulator-shell error-state" role="alert">
          <h1>VENT SIMULATOR 2D</h1>
          <p>시뮬레이터 화면을 불러오지 못했습니다. 새로고침 후 다시 시도하세요.</p>
        </main>
      );
    }

    return this.props.children;
  }
}
