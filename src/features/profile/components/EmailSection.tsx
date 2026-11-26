import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ListRow } from '@/components/ui/ListRow';
import { ResendTimer } from '@/components/ui/ResendTimer';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { emailSchema } from '@/lib/contact';
import { monotonicNow, serverNow } from '@/lib/server-clock';
import { useAuthActions } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { services, type User } from '@/services';
import { isApiError } from '@/services/http/errors';
import { queryKeys } from '@/services/query';
import { contactErrorKey } from './contactError';
import { ReauthSheet } from './ReauthSheet';

type Change = { email: string; makePrimary: boolean };

/** Main and additional addresses: add or change with an e-mailed code, remove. */
export function EmailSection({ user }: { user: User }) {
  const { t } = useTranslation();
  const toast = useToast();
  const client = useQueryClient();
  const { updateUser } = useAuthActions();
  const query = useQuery({
    queryKey: queryKeys.user.emails(),
    queryFn: ({ signal }) => services.user.emails({ signal }),
  });
  const { refetch } = query;
  const [form, setForm] = useState<{ makePrimary: boolean }>();
  const [draft, setDraft] = useState('');
  const [code, setCode] = useState('');
  const [removing, setRemoving] = useState<string>();
  /** The change requested here, kept so an expired code can be sent again. */
  const [requested, setRequested] = useState<Change>();
  const [resendAt, setResendAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  /** The action that needs a recent sign-in, repeated once it is proven. */
  const [reauth, setReauth] = useState<{ retry: () => Promise<void> }>();
  const lock = useRef(false);
  const pending = query.data?.pending ?? null;
  const expiresAt = pending?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(
      () => {
        void refetch();
      },
      Math.max(0, Date.parse(expiresAt) - serverNow().getTime()) + 500,
    );
    return () => clearTimeout(timer);
  }, [expiresAt, refetch]);

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    const epoch = authOperation.epoch();
    try {
      await action();
    } catch (cause) {
      if (!authOperation.current(epoch)) return;
      if (isApiError(cause) && cause.code === 'REAUTH_REQUIRED') {
        setReauth({ retry: action });
        return;
      }
      if (isApiError(cause) && cause.retryAfterSeconds !== null)
        setResendAt(monotonicNow() + cause.retryAfterSeconds * 1000);
      setError(t(contactErrorKey(cause)));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const request = (change: Change) =>
    run(async () => {
      const challenge = await services.user.requestEmail(change);
      setResendAt(monotonicNow() + challenge.retryAfterSeconds * 1000);
      setRequested(change);
      setForm(undefined);
      setCode('');
      await refetch();
    });
  const submit = () => {
    const parsed = emailSchema.safeParse(draft);
    if (!form) return;
    if (!parsed.success) {
      setError(t('auth.invalidEmail'));
      return;
    }
    void request({ email: parsed.data, makePrimary: form.makePrimary });
  };
  const verify = (email: string) =>
    run(async () => {
      const list = await services.user.verifyEmail({ email, code });
      client.setQueryData(queryKeys.user.emails(), list);
      setRequested(undefined);
      setCode('');
      toast(t('profile.saved'));
      // The main address may have changed; the change stands even if this read fails.
      const me = await services.user.me().catch(() => null);
      if (me?.id === user.id) updateUser(me);
    });
  const cancel = () =>
    run(async () => {
      await services.user.cancelPendingEmail();
      setRequested(undefined);
      setCode('');
      await refetch();
    });
  const remove = (email: string) =>
    run(async () => {
      await services.user.removeEmail(email);
      setRemoving(undefined);
      await refetch();
    });
  const open = (makePrimary: boolean) => {
    setForm({ makePrimary });
    setDraft('');
    setError(undefined);
  };

  const listed = query.data?.items ?? [];
  // An older account's address may not be a sign-in e-mail yet: it is still shown.
  const items =
    user.email && !listed.some((item) => item.email === user.email)
      ? [{ email: user.email, primary: true }, ...listed]
      : listed;
  return (
    <View style={{ gap: spacing[12] }}>
      <Text variant="headline" accessibilityRole="header">
        {t('contact.emailTitle')}
      </Text>
      {items.length === 0 && !query.isLoading && (
        <Text variant="caption">{t('contact.noEmail')}</Text>
      )}
      {items.map((item) => (
        <View key={item.email} style={{ gap: spacing[8] }}>
          <ListRow
            title={item.email}
            subtitle={t(item.primary ? 'contact.primary' : 'contact.secondary')}
          />
          {!item.primary &&
            (removing === item.email ? (
              <>
                <Text accessibilityLiveRegion="polite">
                  {t('contact.removeEmailConfirm', { email: item.email })}
                </Text>
                <Button
                  variant="destructive"
                  label={t('contact.confirmRemove')}
                  loading={busy}
                  onPress={() => {
                    void remove(item.email);
                  }}
                />
                <Button
                  variant="ghost"
                  label={t('common.cancel')}
                  disabled={busy}
                  onPress={() => setRemoving(undefined)}
                />
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  label={t('contact.makePrimary', { email: item.email })}
                  disabled={busy}
                  onPress={() => {
                    void request({ email: item.email, makePrimary: true });
                  }}
                />
                <Button
                  variant="ghost"
                  label={t('contact.removeEmail', { email: item.email })}
                  disabled={busy}
                  onPress={() => setRemoving(item.email)}
                />
              </>
            ))}
        </View>
      ))}
      {query.isError && (
        <>
          <Text accessibilityRole="alert">{t('errors.generic')}</Text>
          <Button
            variant="ghost"
            label={t('common.retry')}
            onPress={() => {
              void refetch();
            }}
          />
        </>
      )}
      {pending ? (
        <>
          <Text accessibilityLiveRegion="polite">
            {t(
              pending.makePrimary
                ? 'contact.pendingPrimary'
                : 'contact.pending',
              { email: pending.email },
            )}
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
            label={t('auth.verifyCode')}
            disabled={code.length !== 6}
            loading={busy}
            onPress={() => {
              void verify(pending.email);
            }}
          />
          <ResendTimer
            deadline={resendAt}
            disabled={busy}
            onResend={() => {
              void request({
                email: pending.email,
                makePrimary: pending.makePrimary,
              });
            }}
          />
          <Button
            variant="ghost"
            label={t('contact.cancelChange')}
            disabled={busy}
            onPress={() => {
              void cancel();
            }}
          />
        </>
      ) : form ? (
        <>
          <Input
            label={t('contact.newEmail')}
            hint={t(
              form.makePrimary ? 'contact.changeHint' : 'contact.addHint',
            )}
            value={draft}
            onChangeText={setDraft}
            editable={!busy}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            maxLength={254}
            onSubmitEditing={submit}
          />
          <Button
            label={t('auth.sendCode')}
            disabled={!draft.trim()}
            loading={busy}
            onPress={submit}
          />
          <Button
            variant="ghost"
            label={t('common.cancel')}
            disabled={busy}
            onPress={() => {
              setForm(undefined);
              setError(undefined);
            }}
          />
        </>
      ) : (
        query.data && (
          <>
            {requested && (
              <>
                <Text accessibilityRole="alert">
                  {t('contact.expired', { email: requested.email })}
                </Text>
                <Button
                  label={t('contact.newCode')}
                  loading={busy}
                  onPress={() => {
                    void request(requested);
                  }}
                />
              </>
            )}
            <Button
              variant="secondary"
              label={t(user.email ? 'contact.changeEmail' : 'contact.addEmail')}
              disabled={busy}
              onPress={() => open(true)}
            />
            {user.email && (
              <Button
                variant="ghost"
                label={t('contact.addSecondary')}
                disabled={busy}
                onPress={() => open(false)}
              />
            )}
          </>
        )
      )}
      {error && (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
      {reauth && (
        <ReauthSheet
          user={user}
          onClose={() => setReauth(undefined)}
          onVerified={() => {
            setReauth(undefined);
            void run(reauth.retry);
          }}
        />
      )}
    </View>
  );
}
