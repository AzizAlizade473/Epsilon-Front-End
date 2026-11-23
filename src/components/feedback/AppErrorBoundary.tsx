import { Component, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import { Screen } from '@/components/ui/Screen';
import { i18n } from '@/lib/i18n';
import { reportApplicationError } from '@/lib/error-reporting';
import { env } from '@/lib/env';
import az from '../../../locales/az.json';
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; generation: number; detail?: string }
> {
  state: { failed: boolean; generation: number; detail?: string } = {
    failed: false,
    generation: 0,
  };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    reportApplicationError(error);
    // Internal development builds only: the screen names the error type and the
    // failing components (never the message, which may hold personal data); the
    // full message goes to the device log.
    if (isDevelopmentBuild()) {
      const where = info.componentStack
        ?.trim()
        .split(/\s*\n\s*/)
        .slice(0, 4)
        .map((line) => line.replace(/^at\s+/, '').split(' ')[0])
        .join(' ‹ ');
      const kind = error instanceof Error ? error.name : typeof error;
      console.error('[app] render failed', String(error), where);
      this.setState({ detail: where ? `${kind} — ${where}` : kind });
    }
  }
  render() {
    return this.state.failed ? (
      <Screen scroll={false}>
        <ErrorState
          title={i18n.t('resilience.errorTitle', az.resilience.errorTitle)}
          {...(this.state.detail ? { message: this.state.detail } : {})}
          retryLabel={i18n.t('resilience.reload', az.resilience.reload)}
          onRetry={() =>
            this.setState((state) => ({
              failed: false,
              detail: undefined,
              generation: state.generation + 1,
            }))
          }
        />
      </Screen>
    ) : (
      <ComponentGeneration key={this.state.generation}>
        {this.props.children}
      </ComponentGeneration>
    );
  }
}
function ComponentGeneration({ children }: { children: ReactNode }) {
  return children;
}

/** Never throws: the crash screen must not depend on a readable configuration. */
function isDevelopmentBuild() {
  try {
    return env.EXPO_PUBLIC_APP_ENV === 'development';
  } catch {
    return false;
  }
}
