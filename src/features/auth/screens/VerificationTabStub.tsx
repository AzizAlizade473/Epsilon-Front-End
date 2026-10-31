import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/ui/Screen';
import { PhoneVerificationBanner } from '../components/PhoneVerificationBanner';

/** Existing route placeholder plus STEP 10's optional-verification reminder only. */
export function VerificationTabStub({ title }: { title: 'home' | 'cashback' }) {
  const { t } = useTranslation();
  return (
    <Screen title={t(`navigation.${title}`)} edges={['top', 'left', 'right']}>
      <PhoneVerificationBanner />
    </Screen>
  );
}
