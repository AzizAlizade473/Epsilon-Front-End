import { Component, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import { Screen } from '@/components/ui/Screen';
import { i18n } from '@/lib/i18n';
import { reportApplicationError } from '@/lib/error-reporting';
import az from '../../../locales/az.json';
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; generation: number }
> {
  state = { failed: false, generation: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    reportApplicationError(error);
  }
  render() {
    return this.state.failed ? (
      <Screen scroll={false}>
        <ErrorState
          title={i18n.t('resilience.errorTitle', az.resilience.errorTitle)}
          retryLabel={i18n.t('resilience.reload', az.resilience.reload)}
          onRetry={() =>
            this.setState((state) => ({
              failed: false,
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
