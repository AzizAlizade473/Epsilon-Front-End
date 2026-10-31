import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import Store from 'lucide-react-native/icons/store';

import { ListRow } from '@/components/ui/ListRow';

test('read-only rows preserve details without presenting a navigation action', async () => {
  await render(
    <ListRow icon={Store} title="Restaurant" subtitle="Branch" value="Value" />,
  );
  expect(screen.getByText('Branch')).toBeOnTheScreen();
  expect(screen.getByText('Value')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();
});

test('action rows announce their title, subtitle and value together', async () => {
  const open = jest.fn();
  await render(
    <ListRow title="Language" subtitle="Interface" value="AZ" onPress={open} />,
  );
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Language, Interface, AZ' }));
  expect(open).toHaveBeenCalledTimes(1);
});
