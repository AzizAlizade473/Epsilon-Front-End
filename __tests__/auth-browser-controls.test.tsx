import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import az from '../locales/az.json';
import { initializeI18n } from '@/lib/i18n';
import { GoogleEntry } from '@/features/auth/components/AuthEntryActions';
import { BirthDateField } from '@/features/auth/components/BirthDateField.web';

jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: true } }));
test('browser Google control cannot invoke a native-only provider even if its flag is enabled', async () => {
  await initializeI18n('az');
  const platform = jest.replaceProperty(Platform, 'OS', 'web');
  const onPress = jest.fn();
  try {
    await render(
      <GoogleEntry busy={false} loading={false} onPress={onPress} />,
    );
    const google = screen.getByRole('button', { name: az.auth.continueGoogle });
    expect(google).toBeDisabled();
    expect(screen.getByText(az.authFlow.googleNativeOnly)).toBeOnTheScreen();
    await fireEvent.press(google);
    expect(onPress).not.toHaveBeenCalled();
  } finally {
    platform.restore();
  }
});
test('browser registration can edit its retained date field without opening a native picker', async () => {
  await initializeI18n('az');
  const onChange = jest.fn();
  await render(
    <BirthDateField
      value="2000-01-01"
      maximumDate={new Date('2026-11-02')}
      onChange={onChange}
    />,
  );
  await fireEvent.changeText(
    screen.getByLabelText(az.onboarding.birthDate),
    '1990-04-12',
  );
  expect(onChange).toHaveBeenCalledWith('1990-04-12');
});
