import { afterEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { ResendTimer } from '@/features/auth/components/ResendTimer';
import { initializeI18n } from '@/lib/i18n';
import az from '../locales/az.json';

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('uses one accessible SMS input, supports paste and suppresses editing while busy', async () => {
  await initializeI18n();
  const onChange = jest.fn();
  const view = await render(<OtpInput value="" onChange={onChange} />);
  const input = screen.getByLabelText(az.auth.codeLabel);
  expect(input).toHaveProp('textContentType', 'oneTimeCode');
  expect(input).toHaveProp('autoComplete', 'sms-otp');
  await fireEvent.changeText(input, '12 34 56');
  expect(onChange).toHaveBeenCalledWith('123456');
  await view.rerender(<OtpInput value="123456" disabled onChange={onChange} />);
  expect(screen.getByLabelText(az.auth.codeLabel)).toHaveProp(
    'editable',
    false,
  );
});

it('resend deadline survives remount and recalculates after backgrounding', async () => {
  await initializeI18n();
  jest.useFakeTimers();
  const onResend = jest.fn();
  const listener = jest.spyOn(AppState, 'addEventListener');
  const deadline = performance.now() + 60000;
  const view = await render(
    <ResendTimer deadline={deadline} onResend={onResend} />,
  );
  expect(screen.getByRole('button')).toBeDisabled();
  await fireEvent.press(screen.getByRole('button'));
  expect(onResend).not.toHaveBeenCalled();
  await view.unmount();
  await act(async () => {
    jest.advanceTimersByTime(61000);
  });
  await render(<ResendTimer deadline={deadline} onResend={onResend} />);
  const callback = listener.mock.calls.at(-1)?.[1];
  await act(async () => {
    callback?.('active');
  });
  const resend = screen.getByRole('button', { name: az.auth.resend });
  expect(resend).toBeEnabled();
  await fireEvent.press(resend);
  expect(onResend).toHaveBeenCalledTimes(1);
});
