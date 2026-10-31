import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import { Toast } from '@/components/feedback/Toast';

test('Toast announces only while visible and offers a named dismissal', async () => {
  const dismiss = jest.fn();
  const props = {
    message: 'Saved',
    dismissLabel: 'Close message',
    onDismiss: dismiss,
  };
  const view = await render(<Toast {...props} visible={false} />);
  expect(screen.queryByRole('alert')).toBeNull();
  await view.rerender(<Toast {...props} visible />);
  expect(screen.getByRole('alert')).toHaveTextContent('Saved');
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Close message' }));
  expect(dismiss).toHaveBeenCalledTimes(1);
});
