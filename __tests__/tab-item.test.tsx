import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import House from 'lucide-react-native/icons/house';

import { TabItem } from '@/components/ui/TabItem';

test.each([false, true])(
  'TabItem exposes selected=%s and keeps its action named',
  async (selected) => {
    const press = jest.fn();
    await render(
      <TabItem label="Home" icon={House} selected={selected} onPress={press} />,
    );
    await userEvent
      .setup()
      .press(screen.getByRole('tab', { name: 'Home', selected }));
    expect(press).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('image')).toBeNull();
  },
);
