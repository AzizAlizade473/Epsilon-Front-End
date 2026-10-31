import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';

test('Button prevents repeat submissions while loading and retains its label layout', async () => {
  const submit = jest.fn();
  function Form() {
    const [loading, setLoading] = useState(false);
    return (
      <Button
        label="Send"
        loading={loading}
        onPress={() => {
          submit();
          setLoading(true);
        }}
      />
    );
  }
  await render(<Form />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: 'Send' }));
  expect(screen.getByRole('button', { name: 'Send' })).toBeBusy();
  await user.press(screen.getByRole('button', { name: 'Send' }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText('Send', { includeHiddenElements: true }),
  ).toBeOnTheScreen();
});

test.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
  'the %s variant retains its accessible name',
  async (variant) => {
    await render(
      <Button label="Continue" variant={variant} onPress={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  },
);
