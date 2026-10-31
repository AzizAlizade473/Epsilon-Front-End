import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import X from 'lucide-react-native/icons/x';

import { IconButton } from '@/components/ui/IconButton';

test('IconButton has one accessible action and hides its decorative glyph', async () => {
  const close = jest.fn();
  await render(
    <IconButton icon={X} accessibilityLabel="Close" onPress={close} />,
  );
  await userEvent.setup().press(screen.getByRole('button', { name: 'Close' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('image')).toBeNull();
});

test('a loading IconButton blocks further actions', async () => {
  const close = jest.fn();
  await render(
    <IconButton icon={X} accessibilityLabel="Close" onPress={close} loading />,
  );
  const button = screen.getByRole('button', { name: 'Close' });
  expect(button).toBeBusy();
  await userEvent.setup().press(button);
  expect(close).not.toHaveBeenCalled();
});
