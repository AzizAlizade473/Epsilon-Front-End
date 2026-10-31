import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import az from '../locales/az.json';

import { ScanAction } from '@/components/ui/ScanAction';
import { initializeI18n } from '@/lib/i18n';

const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (effect: () => void) => react.useEffect(effect, [effect]),
  };
});

test('Scan is a repeat-press-safe action that pushes the full-screen modal', async () => {
  await initializeI18n();
  await render(<ScanAction />);
  const user = userEvent.setup();
  const action = screen.getByRole('button', { name: az.navigation.scan });
  await user.press(action);
  await user.press(action);
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/scan');
  expect(screen.queryByRole('tab')).toBeNull();
});
