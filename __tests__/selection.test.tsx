import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Switch } from '@/components/ui/Switch';

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
