import { afterEach, expect, jest, test } from '@jest/globals';
import * as ui from '@testing-library/react-native';
import * as Splash from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import az from '../locales/az.json';

import { Text } from '@/components/ui/Text';
import type { BootData } from '@/lib/bootstrap';
import { initializeI18n } from '@/lib/i18n';
import { BootstrapGate } from '@/providers/BootstrapGate';

const { act, fireEvent, render, userEvent } = ui;

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(async () => undefined),
}));
afterEach(() => {
  jest.clearAllMocks();
});
const boot: BootData = { session: null, onboardingComplete: false };
const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 24, bottom: 24, left: 0, right: 0 },
};
const renderGate = (load: () => Promise<BootData>) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <BootstrapGate load={load}>
        <Text>Ready</Text>
      </BootstrapGate>
    </SafeAreaProvider>,
  );

test('splash stays held until boot succeeds and ready content has laid out', async () => {
  await initializeI18n();
  let finish: (value: BootData) => void = () => {};
  const promise = new Promise<BootData>((resolve) => {
    finish = resolve;
  });
  await renderGate(() => promise);
  expect(ui.screen.queryByText('Ready')).toBeNull();
  expect(Splash.hideAsync).not.toHaveBeenCalled();
  await act(async () => {
    finish(boot);
  });
  expect(ui.screen.getByText('Ready')).toBeOnTheScreen();
  expect(Splash.hideAsync).not.toHaveBeenCalled();
  await fireEvent(ui.screen.getByTestId('boot-layout'), 'layout', {});
  expect(Splash.hideAsync).toHaveBeenCalledTimes(1);
});

test('boot failures show a generic retry and can recover', async () => {
  await initializeI18n();
  const load = jest
    .fn<() => Promise<BootData>>()
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValue(boot);
  await renderGate(load);
  expect(ui.screen.getByRole('alert')).toHaveTextContent(az.navigation.error);
  await userEvent
    .setup()
    .press(ui.screen.getByRole('button', { name: az.navigation.retry }));
  expect(ui.screen.getByText('Ready')).toBeOnTheScreen();
});
