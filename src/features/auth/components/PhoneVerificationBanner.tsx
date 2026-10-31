import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';

export function PhoneVerificationBanner() {
  const auth = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  if (
    !auth.session ||
    auth.user?.phoneVerified ||
    auth.requirePhoneVerification
  )
    return null;
  return (
    <Button
      variant="ghost"
      label={t('onboarding.verifyBanner')}
      onPress={() => router.push('/phone-verify')}
    />
  );
}
