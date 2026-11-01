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
import { env } from '@/lib/env';
import { googleDriver } from '@/lib/google-signin';
import { maskedPhone } from '@/lib/profile';
import { useAuthActions } from '@/providers/AuthProvider';
import { services, type AuthResult, type User } from '@/services';
import { generateIdempotencyKey } from '@/services/http/idempotency';

export function DeleteAccountFlow({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const actions = useAuthActions();
  const [phase, setPhase] = useState<'warning' | 'reauth' | 'code' | 'confirm'>(
    'warning',
  );
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const authenticated = useRef(false);
  const [key] = useState(() => generateIdempotencyKey('delete-account'));
  const epoch = useRef(authOperation.epoch());
  const keyword = t('profile.deleteKeyword');
  const fresh = async (result: AuthResult | null) => {
    if (!result) return;
    if (
      !authOperation.current(epoch.current) ||
      result.user.id !== user.id ||
      result.isNewUser
    )
      throw new Error('Account mismatch');
    await actions.reauthenticate(result);
    if (!authOperation.current(epoch.current)) return;
    authenticated.current = true;
    setCode('');
    setPhase('confirm');
  };
  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await operation();
    } catch {
      if (authOperation.current(epoch.current))
        setError(t('profile.deleteError'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const requestCode = () =>
    run(async () => {
      if (!user.phone || !user.phoneVerified) return;
      await services.auth.requestOtp({ phone: user.phone });
      if (authOperation.current(epoch.current)) setPhase('code');
    });
  const verify = () =>
    run(async () => {
      if (!user.phone || !/^\d{6}$/.test(code)) return;
      await fresh(await services.auth.verifyOtp({ phone: user.phone, code }));
    });
  const google = () =>
    run(async () => {
      await googleDriver.signOut();
      await fresh(
        await googleDriver.exchange((idToken) =>
          services.auth.signInWithGoogle({ idToken }),
        ),
      );
    });
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
            <>
              <Text>{t('profile.reauthBody')}</Text>
              {user.phone && user.phoneVerified && (
                <Button
                  label={t('profile.reauthPhone', {
                    phone: maskedPhone(user.phone),
                  })}
                  loading={busy}
                  onPress={() => {
                    void requestCode();
                  }}
                />
              )}
              {env.ENABLE_GOOGLE_SIGNIN &&
                user.identities.some(
                  (identity) => identity.provider === 'google',
                ) && (
                  <Button
                    label={t('profile.reauthGoogle')}
                    disabled={busy}
                    onPress={() => {
                      void google();
                    }}
                  />
                )}
              {!user.phoneVerified && !env.ENABLE_GOOGLE_SIGNIN && (
                <Text>{t('profile.reauthUnavailable')}</Text>
              )}
            </>
          )}
          {phase === 'code' && (
            <>
              <Input
                label={t('profile.smsCode')}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={6}
                value={code}
                editable={!busy}
                onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
              />
              <Button
                label={t('common.continue')}
                disabled={code.length !== 6}
                loading={busy}
                onPress={() => {
                  void verify();
                }}
              />
            </>
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
