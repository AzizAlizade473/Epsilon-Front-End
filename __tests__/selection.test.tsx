import { expect, jest, test } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';

import { Switch } from '@/components/ui/Switch';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

test('SegmentedControl exposes one choice and ignores reselecting it', async () => {
  const change = jest.fn();
  await render(
    <SegmentedControl
      label="Language"
      options={[
        { value: 'az', label: 'AZ' },
        { value: 'en', label: 'EN' },
      ]}
      value="az"
      onValueChange={change}
    />,
  );
  const user = userEvent.setup();
  await user.press(screen.getByRole('radio', { name: 'AZ', checked: true }));
  expect(change).not.toHaveBeenCalled();
  await user.press(screen.getByRole('radio', { name: 'EN', checked: false }));
  expect(change).toHaveBeenCalledWith('en');
});

test.each([false, true])(
  'Switch reports its state and respects disabled=%s',
  async (disabled) => {
    const change = jest.fn();
    await render(
      <Switch
        label="Notifications"
        value={false}
        disabled={disabled}
        onValueChange={change}
      />,
    );
    await fireEvent(
      screen.getByRole('switch', { name: 'Notifications', checked: false }),
      'valueChange',
      true,
    );
    expect(change).toHaveBeenCalledTimes(disabled ? 0 : 1);
  },
);
