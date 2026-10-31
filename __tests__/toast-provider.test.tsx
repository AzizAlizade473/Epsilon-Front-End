import { expect, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import az from '../locales/az.json';

import { Button } from '@/components/ui/Button';
import { initializeI18n } from '@/lib/i18n';
import { RuntimeProviders } from '@/providers/RuntimeProviders';
import { useToast } from '@/providers/ToastProvider';

function Trigger() {
  const show = useToast();
  return <Button label="Test" onPress={() => show('Test notice')} />;
}

test('runtime providers expose a dismissible localized toast without a session', async () => {
  await initializeI18n();
  const metrics = {
    frame: { x: 0, y: 0, width: 360, height: 640 },
    insets: { top: 24, bottom: 24, left: 0, right: 0 },
  };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <RuntimeProviders boot={{ session: null, onboardingComplete: false }}>
        <Trigger />
      </RuntimeProviders>
    </SafeAreaProvider>,
  );
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: 'Test' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Test notice');
  await user.press(screen.getByRole('button', { name: az.navigation.close }));
  expect(screen.queryByRole('alert')).toBeNull();
});
