import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { googleDriver } from '@/lib/google-signin';
import { useAuthActions } from '@/providers/AuthProvider';
import { services, type User } from '@/services';
import { generateIdempotencyKey } from '@/services/http/idempotency';
import { ReauthPanel } from './ReauthPanel';

export function DeleteAccountFlow({
  user,
  onClose,
  onBusyChange,
}: {
  user: User;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const actions = useAuthActions();
  const [phase, setPhase] = useState<'warning' | 'reauth' | 'confirm'>(
    'warning',
  );
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const authenticated = useRef(false);
  const [key] = useState(() => generateIdempotencyKey('delete-account'));
  const epoch = useRef(authOperation.epoch());
  const keyword = t('profile.deleteKeyword');
  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    onBusyChange?.(true);
    setBusy(true);
    setError(undefined);
    try {
      await operation();
    } catch {
      if (authOperation.current(epoch.current))
        setError(t('profile.deleteError'));
    } finally {
      lock.current = false;
      onBusyChange?.(false);
      setBusy(false);
    }
  };
  const remove = () =>
    run(async () => {
      if (
        !authenticated.current ||
        typed !== keyword ||
        !authOperation.current(epoch.current)
      )
        return;
      await services.user.deleteAccount({ idempotencyKey: key });
      if (!authOperation.current(epoch.current)) return;
      await Promise.allSettled([
        googleDriver.revokeAccess(),
        googleDriver.signOut(),
      ]);
      await actions.finishAccountDeletion();
      router.dismissAll();
      router.replace('/welcome');
    });
  return (
    <Sheet
      onClose={onClose}
      onBeforeClose={() => !lock.current}
      accessibilityLabel={t('profile.deleteAccount')}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ gap: spacing[16] }}>
          <Text variant="title2" accessibilityRole="header">
            {t('profile.deleteAccount')}
          </Text>
          {phase === 'warning' && (
            <>
              <Text>{t('profile.deleteBody')}</Text>
              {user.deletionWarning && (
                <Text accessibilityRole="alert">{user.deletionWarning}</Text>
              )}
              <Button
                variant="destructive"
                label={t('common.continue')}
                onPress={() => setPhase('reauth')}
              />
            </>
          )}
          {phase === 'reauth' && (
            <ReauthPanel
              user={user}
              onBusyChange={(value) => {
                lock.current = value;
                setBusy(value);
                onBusyChange?.(value);
              }}
              onVerified={() => {
                authenticated.current = true;
                setPhase('confirm');
              }}
            />
          )}
          {phase === 'confirm' && (
            <>
              <Text>{t('profile.deleteType', { keyword })}</Text>
              <Input
                label={t('profile.deleteConfirmation')}
                value={typed}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!busy}
                onChangeText={setTyped}
              />
              <Button
                variant="destructive"
                label={t('profile.deleteAccount')}
                disabled={typed !== keyword}
                loading={busy}
                onPress={() => {
                  void remove();
                }}
              />
            </>
          )}
          {error && (
            <Text tone="danger" accessibilityRole="alert">
              {error}
            </Text>
          )}
          <Button
            variant="ghost"
            label={t('common.cancel')}
            disabled={busy}
            onPress={onClose}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
