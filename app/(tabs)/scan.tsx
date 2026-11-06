import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
const ScanScreen = lazy(() => import('@/features/scan/screens/ScanScreen'));
export default function Route() {
  const { t } = useTranslation();
  return (
    <AuthBoundary mode="complete">
      <Suspense
        fallback={
          <Screen>
            <Text accessibilityLiveRegion="polite">{t('common.loading')}</Text>
          </Screen>
        }
      >
        <ScanScreen />
      </Suspense>
    </AuthBoundary>
  );
}
