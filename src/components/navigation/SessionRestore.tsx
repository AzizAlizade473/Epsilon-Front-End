import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

export function SessionRestore({
  failed,
  onRetry,
}: {
  failed: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text
        accessibilityRole={failed ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
      >
        {t(failed ? 'errors.generic' : 'common.loading')}
      </Text>
      {failed && <Button label={t('common.retry')} onPress={onRetry} />}
    </Screen>
  );
}
