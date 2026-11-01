import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { env } from '@/lib/env';

export function MockDataNotice() {
  const { t } = useTranslation();
  return __DEV__ &&
    env.EXPO_PUBLIC_APP_ENV !== 'production' &&
    env.EXPO_PUBLIC_API_MODE === 'mock' ? (
    <Text variant="caption">{t('product.demoData')}</Text>
  ) : null;
}
