import { monotonicNow } from '@/lib/server-clock';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

/** Absolute display deadline survives background/navigation; server enforces limits. */
export function useSecondsUntil(deadline: number) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.ceil((deadline - monotonicNow()) / 1000)),
  );
  useEffect(() => {
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((deadline - monotonicNow()) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    const subscription = AppState.addEventListener('change', update);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [deadline]);
  return seconds;
}

export function ResendTimer({
  deadline,
  busy,
  disabled,
  onResend,
}: {
  deadline: number;
  busy?: boolean;
  disabled?: boolean;
  onResend: () => void;
}) {
  const { t } = useTranslation();
  const seconds = useSecondsUntil(deadline);
  return (
    <Button
      variant="ghost"
      label={
        seconds > 0 ? t('auth.resendAfter', { s: seconds }) : t('auth.resend')
      }
      loading={busy}
      disabled={disabled || seconds > 0}
      onPress={onResend}
    />
  );
}
