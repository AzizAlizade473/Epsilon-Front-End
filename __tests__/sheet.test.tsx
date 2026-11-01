import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import az from '../locales/az.json';

import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { initializeI18n } from '@/lib/i18n';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 24, bottom: 24, left: 0, right: 0 },
};
test('hidden sheets render no content and register no Android Back handler', async () => {
  const listener = jest.spyOn(BackHandler, 'addEventListener');
  await render(
    <Sheet visible={false} onClose={jest.fn()}>
      <Text>Hidden content</Text>
    </Sheet>,
  );
  expect(screen.queryByText('Hidden content')).toBeNull();
  expect(listener).not.toHaveBeenCalled();
  listener.mockRestore();
});

test('Sheet renders children and dismisses via backdrop press or Android Back', async () => {
  await initializeI18n();
  const onClose = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Sheet onClose={onClose}>
        <Text>Sheet Content</Text>
      </Sheet>
    </SafeAreaProvider>,
  );

  expect(screen.getByText('Sheet Content')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: az.navigation.close }),
  ).toBeOnTheScreen();

  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: az.navigation.close }));
  expect(onClose).toHaveBeenCalled();
});

test('Sheet registers Android hardwareBackPress handler that dismisses', async () => {
  await initializeI18n();
  let backListener: (() => void) | undefined;
  const spy = jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, handler) => {
      backListener = () =>
        handler({ type: 'hardwareBackPress', timeStamp: Date.now() });
      return { remove: jest.fn() };
    });

  const onBackClose = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Sheet onClose={onBackClose}>
        <Text>Modal 2</Text>
      </Sheet>
    </SafeAreaProvider>,
  );

  expect(backListener).toBeDefined();
  backListener?.();
  expect(onBackClose).toHaveBeenCalled();
  spy.mockRestore();
});
