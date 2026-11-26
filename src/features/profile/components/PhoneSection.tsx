import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { useAuthActions } from '@/providers/AuthProvider';
import { services, type User } from '@/services';
import { contactErrorKey } from './contactError';
import { isApiError } from '@/services/http/errors';
import { ReauthSheet } from './ReauthSheet';

/** The optional phone number: add, change (remove, then add) or remove. */
export function PhoneSection({ user }: { user: User }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateUser } = useAuthActions();
  const [confirming, setConfirming] = useState<'change' | 'remove'>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [reauth, setReauth] = useState(false);
  const lock = useRef(false);
  const add = () => router.push('/phone-verify');
  const remove = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    const epoch = authOperation.epoch();
    try {
      await services.user.removePhone();
      if (!authOperation.current(epoch)) return;
      // The removal is done even if the fresh profile cannot be read.
      const me = await services.user
        .me()
        .catch(() => ({ ...user, phone: null, phoneVerified: false }));
      if (!authOperation.current(epoch) || me.id !== user.id) return;
      updateUser(me);
      setConfirming(undefined);
      if (confirming === 'change') add();
    } catch (cause) {
      if (!authOperation.current(epoch)) return;
      // Removal needs a recent sign-in; it is repeated once that is proven.
      if (isApiError(cause) && cause.code === 'REAUTH_REQUIRED')
        setReauth(true);
      else setError(t(contactErrorKey(cause)));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: spacing[12] }}>
      <ListRow
        title={t('profile.phone')}
        subtitle={user.phone ?? t('contact.noPhone')}
      />
      <Text variant="caption">
        {user.email
          ? t('contact.phoneHelp', { email: user.email })
          : t('contact.errors.EMAIL_REQUIRED')}
      </Text>
      {!user.phone ? (
        <Button
          variant="secondary"
          label={t('contact.addPhone')}
          disabled={!user.email}
          onPress={add}
        />
      ) : confirming ? (
        <>
          <Text accessibilityLiveRegion="polite">
            {t(
              confirming === 'change'
                ? 'contact.changePhoneConfirm'
                : 'contact.removePhoneConfirm',
            )}
          </Text>
          <Button
            variant="destructive"
            label={t('contact.confirmRemove')}
            loading={busy}
            onPress={() => {
              void remove();
            }}
          />
          <Button
            variant="ghost"
            label={t('common.cancel')}
            disabled={busy}
            onPress={() => {
              setConfirming(undefined);
              setError(undefined);
            }}
          />
        </>
      ) : (
        <>
          {user.email && (
            <Button
              variant="secondary"
              label={t('contact.changePhone')}
              onPress={() => setConfirming('change')}
            />
          )}
          <Button
            variant="ghost"
            label={t('contact.removePhone')}
            onPress={() => setConfirming('remove')}
          />
        </>
      )}
      {reauth && (
        <ReauthSheet
          user={user}
          onClose={() => setReauth(false)}
          onVerified={() => {
            setReauth(false);
            void remove();
          }}
        />
      )}
      {error && (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
