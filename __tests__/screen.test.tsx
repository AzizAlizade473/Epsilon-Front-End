import { expect, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { typography } from '@/design';

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 24, bottom: 24, left: 0, right: 0 },
};

test.each([true, false])(
  'Screen exposes one heading with scroll=%s and preserves its footer',
  async (scroll) => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <Screen title="History" scroll={scroll} footer={<Text>Continue</Text>}>
          <Text>Content</Text>
        </Screen>
      </SafeAreaProvider>,
    );
    expect(screen.getAllByRole('header')).toHaveLength(1);
    expect(screen.getByRole('header', { name: 'History' })).toBeOnTheScreen();
    expect(screen.getByText('Content')).toBeOnTheScreen();
    expect(screen.getByText('Continue')).toBeOnTheScreen();
  },
);

test('a measured large title collapses and restores with one accessible heading', async () => {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Screen title="History">
        <Text>Content</Text>
      </Screen>
    </SafeAreaProvider>,
  );
  await fireEvent(screen.getByRole('header'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 76 } },
  });
  const scroll = screen.getByTestId('screen-scroll');
  await fireEvent.scroll(scroll, {
    nativeEvent: { contentOffset: { x: 0, y: 120 } },
  });
  expect(screen.getAllByRole('header')).toHaveLength(1);
  expect(screen.getByRole('header')).toHaveStyle({
    fontSize: typography.headline.fontSize,
  });
  await fireEvent.scroll(scroll, {
    nativeEvent: { contentOffset: { x: 0, y: 0 } },
  });
  expect(screen.getAllByRole('header')).toHaveLength(1);
  expect(screen.getByRole('header')).toHaveStyle({
    fontSize: typography.title1.fontSize,
  });
});
