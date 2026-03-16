// ═══════════════════════════════════════════════════════════════
//  Report v7 — Error Boundary
//  Section-level error isolation: wraps individual cards or zones.
//  Props ≤ 3: children, fallback, componentName
// ═══════════════════════════════════════════════════════════════

import { Component, type ErrorInfo, type ReactNode } from 'react';

// ─── Props ────────────────────────────────────────────────────
interface ReportErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI rendered on error. If omitted, uses default. */
  fallback?: ReactNode;
  /** Name of the wrapped component/section for logging. */
  componentName: string;
}

interface ReportErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// ─── Default Fallback ─────────────────────────────────────────
function DefaultErrorFallback({ componentName }: { componentName: string }) {
  return (
    <div
      className="rv7-glass"
      style={{
        padding: '20px',
        textAlign: 'center',
        opacity: 0.7,
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-2)',
          marginBottom: '4px',
        }}
      >
        {componentName}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-3)',
          lineHeight: 1.5,
        }}
      >
        이 섹션을 표시할 수 없습니다.
      </div>
    </div>
  );
}

// ─── Error Boundary (class component required by React) ───────
export class ReportErrorBoundary extends Component<
  ReportErrorBoundaryProps,
  ReportErrorBoundaryState
> {
  constructor(props: ReportErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ReportErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log for debugging — no external service in Phase 0
    console.error(
      `[ReportV7 ErrorBoundary] ${this.props.componentName}:`,
      error.message,
      errorInfo.componentStack,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback componentName={this.props.componentName} />;
    }
    return this.props.children;
  }
}
