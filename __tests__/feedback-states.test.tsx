import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import Wallet from 'lucide-react-native/icons/wallet';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

test('EmptyState explains the empty view without inventing an action', async () => {
  await render(
    <EmptyState
      icon={Wallet}
      title="No activity"
      message="Activity will appear here."
    />,
  );
  expect(screen.getByRole('header', { name: 'No activity' })).toBeOnTheScreen();
  expect(screen.getByText('Activity will appear here.')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();
});

test('ErrorState announces the error and offers a retry', async () => {
  const retry = jest.fn();
  await render(
    <ErrorState
      title="Something went wrong"
      retryLabel="Retry"
      onRetry={retry}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
