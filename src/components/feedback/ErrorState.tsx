import CircleAlert from 'lucide-react-native/icons/circle-alert';

import { StatePanel, type StatePanelProps } from './StatePanel';

export type ErrorStateProps = Pick<StatePanelProps, 'title' | 'message'> & {
  retryLabel: string;
  onRetry: () => void;
  loading?: boolean;
};

export function ErrorState({
  retryLabel,
  onRetry,
  loading,
  ...props
}: ErrorStateProps) {
  return (
    <StatePanel
      {...props}
      icon={CircleAlert}
      alert
      action={{ label: retryLabel, onPress: onRetry, loading }}
    />
  );
}
