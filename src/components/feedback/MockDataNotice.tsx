import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { demoContent } from '@/lib/demoContent';

export function MockDataNotice() {
  const { t } = useTranslation();
  return demoContent() ? (
    <Text variant="caption">{t('product.demoData')}</Text>
  ) : null;
}
