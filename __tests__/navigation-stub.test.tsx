import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import az from '../locales/az.json';

import { createStubScreen } from '@/components/navigation/StubScreen';
import { initializeI18n } from '@/lib/i18n';

test('route stubs show only their localized accessible heading', async () => {
  await initializeI18n();
  const Stub = createStubScreen('phone');
  const metrics = {
    frame: { x: 0, y: 0, width: 360, height: 640 },
    insets: { top: 24, bottom: 24, left: 0, right: 0 },
  };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Stub />
    </SafeAreaProvider>,
  );
  expect(
    screen.getByRole('header', { name: az.navigation.phone }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();
});
