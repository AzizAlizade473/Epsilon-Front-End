import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';

test('a status chip inside a Card preserves its text without offering an action', async () => {
  await render(
    <Card>
      <Chip label="Pending" tone="warning" />
    </Card>,
  );
  expect(screen.getByText('Pending')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();
});

test('a selected chip exposes its state and action', async () => {
  const toggle = jest.fn();
  await render(<Chip label="Taste" selected onPress={toggle} />);
  const chip = screen.getByRole('button', { name: 'Taste', selected: true });
  await userEvent.setup().press(chip);
  expect(toggle).toHaveBeenCalledTimes(1);
});
