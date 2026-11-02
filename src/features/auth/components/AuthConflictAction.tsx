import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { AuthIntentError } from '@/lib/auth-intent';
import { otpChallenge } from '../store';

export function AuthConflictAction({
  reason,
  onNavigate,
}: {
  reason?: AuthIntentError['reason'];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  if (reason !== 'notFound' && reason !== 'exists') return null;
  const target = reason === 'notFound' ? 'register' : 'login';
  return (
    <Button
      variant="ghost"
      label={t(`authEntry.${target}`)}
      onPress={() => {
        onNavigate?.();
        otpChallenge.clear();
        router.replace(target === 'register' ? '/register' : '/login');
      }}
    />
  );
}
