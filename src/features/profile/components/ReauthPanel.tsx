import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
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
import type { OtpSubject } from '@/services/interfaces';
import { contactErrorKey } from './contactError';

/**
 * Proves the same account again before a sensitive change. The e-mail code is chosen
 * from `user.email`; a verified phone (code also e-mailed) and Google remain options.
 */
export function ReauthPanel({
  user,
  onVerified,
  onBusyChange,
}: {
  user: User;
  onVerified: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const actions = useAuthActions();
  const [subject, setSubject] = useState<OtpSubject>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const epoch = useRef(authOperation.epoch());
  const google =
    env.ENABLE_GOOGLE_SIGNIN &&
    user.identities.some((identity) => identity.provider === 'google');
  const phone = user.phoneVerified ? user.phone : null;
  const fresh = async (result: AuthResult | null) => {
    if (!result) return;
    if (
      !authOperation.current(epoch.current) ||
      result.user.id !== user.id ||
      result.isNewUser
    )
      throw new Error('Account mismatch');
    await actions.reauthenticate(result);
    if (authOperation.current(epoch.current)) onVerified();
  };
  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    onBusyChange?.(true);
    setBusy(true);
    setError(undefined);
    try {
      await operation();
    } catch (cause) {
      if (authOperation.current(epoch.current))
        setError(t(contactErrorKey(cause, 'profile.deleteError')));
    } finally {
      lock.current = false;
      onBusyChange?.(false);
      setBusy(false);
    }
  };
  // "login" never creates an account for an address that cannot sign in yet.
  const intent = (next: OtpSubject) =>
    next.email ? ({ intent: 'login' } as const) : {};
  const send = (next: OtpSubject) =>
    run(async () => {
      await services.auth.requestOtp({ ...next, ...intent(next) });
      if (authOperation.current(epoch.current)) setSubject(next);
    });
  const verify = () =>
    run(async () => {
      if (!subject || !/^\d{6}$/.test(code)) return;
      await fresh(
        await services.auth.verifyOtp({ ...subject, code, ...intent(subject) }),
      );
    });
  return (
    <View style={{ gap: spacing[16] }}>
      {subject ? (
        <>
          <Text accessibilityLiveRegion="polite">
            {user.email
              ? t('contact.codeSent', { email: user.email })
              : t('contact.codeSentAccount')}
          </Text>
          <Input
            label={t('auth.codeLabel')}
            keyboardType="number-pad"
            autoComplete="one-time-code"
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
          <Button
            variant="ghost"
            label={t('contact.newCode')}
            disabled={busy}
            onPress={() => {
              setCode('');
              void send(subject);
            }}
          />
        </>
      ) : (
        <>
          <Text>{t('profile.reauthBody')}</Text>
          {user.email && (
            <Button
              label={t('profile.reauthEmail', { email: user.email })}
              loading={busy}
              onPress={() => {
                void send({ email: user.email! });
              }}
            />
          )}
          {phone && (
            <Button
              variant={user.email ? 'ghost' : 'primary'}
              label={t('profile.reauthPhone', { phone: maskedPhone(phone) })}
              disabled={busy}
              onPress={() => {
                void send({ phone });
              }}
            />
          )}
          {google && (
            <Button
              label={t('profile.reauthGoogle')}
              disabled={busy}
              onPress={() => {
                void run(async () => {
                  await googleDriver.signOut();
                  await fresh(
                    await googleDriver.exchange((idToken) =>
                      services.auth.signInWithGoogle({ idToken }),
                    ),
                  );
                });
              }}
            />
          )}
          {!user.email && !phone && !google && (
            <Text>{t('profile.reauthUnavailable')}</Text>
          )}
        </>
      )}
      {error && (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
