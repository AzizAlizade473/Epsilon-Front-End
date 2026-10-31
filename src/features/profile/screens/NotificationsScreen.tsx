import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Modal, View } from 'react-native';
import { ProfilePage } from '../components/ProfilePage';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { services, type NotificationPreferences } from '@/services';
import { queryKeys } from '@/services/query';
import { useToast } from '@/providers/ToastProvider';
const key = queryKeys.notification.settings();
export function NotificationsScreen({
  enableDevice,
  readPermission,
}: {
  enableDevice: () => Promise<boolean>;
  readPermission: () => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => services.notification.settings({ signal }),
  });
  const [pending, setPending] = useState<NotificationPreferences>();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const check = () => {
      void readPermission()
        .then((granted) => {
          if (active) setDenied(!granted);
        })
        .catch(() => undefined);
    };
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [readPermission]);
  const save = async (input: NotificationPreferences, enable: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    const epoch = authOperation.epoch();
    try {
      if (enable) {
        const granted = await enableDevice();
        if (!authOperation.current(epoch)) return;
        setDenied(!granted);
        if (!granted) {
          setPending(undefined);
          return;
        }
      }
      if (!authOperation.current(epoch)) return;
      const saved = await services.notification.updatePreferences(input);
      if (!authOperation.current(epoch)) return;
      client.setQueryData(key, saved);
      setPending(undefined);
      toast(t('profile.saved'));
    } catch {
      if (authOperation.current(epoch))
        setError(t('profile.notificationSetup'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const change = (name: keyof NotificationPreferences, value: boolean) => {
    if (!query.data || lock.current) return;
    const input = { ...query.data, [name]: value };
    if (value) setPending(input);
    else void save(input, false);
  };
  return (
    <ProfilePage title={t('profile.notifications')}>
      {query.data ? (
        <>
          {(['cashbackUpdates', 'partnerUpdates'] as const).map((name) => (
            <View key={name} style={{ gap: spacing[8] }}>
              <Text>{t(`profile.${name}`)}</Text>
              <Switch
                label={t(`profile.${name}`)}
                value={query.data[name]}
                disabled={busy}
                onValueChange={(value) => change(name, value)}
              />
            </View>
          ))}
          <Text variant="caption">{t('profile.notificationConsent')}</Text>
          {denied && (
            <>
              <Text>{t('profile.notificationDenied')}</Text>
              <Button
                variant="ghost"
                label={t('profile.notificationSettings')}
                onPress={() => {
                  void Linking.openSettings().catch(() =>
                    toast(t('errors.generic')),
                  );
                }}
              />
            </>
          )}
          {error && (
            <Text tone="danger" accessibilityRole="alert">
              {error}
            </Text>
          )}
        </>
      ) : query.isLoading ? (
        <DetailRowSkeleton />
      ) : (
        <ErrorState
          title={t('errors.generic')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
      <Modal
        transparent
        visible={Boolean(pending)}
        onRequestClose={() => {
          if (!busy) setPending(undefined);
        }}
      >
        <Sheet
          accessibilityLabel={t('profile.notifications')}
          onBeforeClose={() => !lock.current}
          onClose={() => setPending(undefined)}
        >
          <View style={{ gap: spacing[16] }}>
            <Text>{t('profile.notificationExplain')}</Text>
            {error && (
              <Text tone="danger" accessibilityRole="alert">
                {error}
              </Text>
            )}
            <Button
              label={t('profile.notificationAllow')}
              loading={busy}
              onPress={() => {
                if (pending) void save(pending, true);
              }}
            />
            <Button
              variant="ghost"
              label={t('common.cancel')}
              disabled={busy}
              onPress={() => setPending(undefined)}
            />
          </View>
        </Sheet>
      </Modal>
    </ProfilePage>
  );
}
