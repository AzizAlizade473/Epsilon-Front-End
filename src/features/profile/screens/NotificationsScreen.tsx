import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Modal, StyleSheet, View } from 'react-native';
import { ProfilePage } from '../components/ProfilePage';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { authOperation } from '@/lib/auth-lifecycle';
import { services, type NotificationPreferences } from '@/services';
import { queryKeys } from '@/services/query';
import { useToast } from '@/providers/ToastProvider';
import { useRouter, type Href } from 'expo-router';
import { PressSurface } from '@/components/ui/PressSurface';
import { colors, radius, spacing } from '@/design';
import { formatDate, formatTime } from '@/lib/date';
import { remotePushAvailable } from '@/services/notification-device';
import { scheduleDailyReminders } from '@/services/local-reminders';
import { notificationTarget } from '@/components/navigation/NotificationRouter';
import type { AppNotification } from '@/services/contracts';
const key = queryKeys.notification.settings();
const inboxKey = queryKeys.notification.inbox();

/** Real server notifications only; read state lives on the server. */
function Inbox() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const client = useQueryClient();
  const inbox = useQuery({
    queryKey: inboxKey,
    queryFn: ({ signal }) =>
      services.notification.list({ limit: 30 }, { signal }),
  });
  const refresh = () => client.invalidateQueries({ queryKey: inboxKey });
  const open = (item: AppNotification) => {
    if (!item.readAt)
      void services.notification
        .markRead(item.id)
        .then(refresh, () => undefined);
    router.push(notificationTarget({ path: item.path }) as Href);
  };
  if (inbox.isLoading) return <DetailRowSkeleton />;
  if (inbox.isError)
    return (
      <ErrorState
        title={t('errors.generic')}
        retryLabel={t('common.retry')}
        onRetry={() => {
          void inbox.refetch();
        }}
      />
    );
  const items = inbox.data?.items ?? [];
  return (
    <View style={{ gap: spacing[8] }}>
      <View style={styles.inboxHead}>
        <Text variant="headline" accessibilityRole="header">
          {t('notifications.inboxTitle')}
        </Text>
        {(inbox.data?.unreadCount ?? 0) > 0 && (
          <Button
            variant="ghost"
            label={t('notifications.markAll')}
            onPress={() => {
              void services.notification
                .markAllRead()
                .then(refresh, () => undefined);
            }}
          />
        )}
      </View>
      {items.length === 0 ? (
        <Text tone="secondary">{t('notifications.empty')}</Text>
      ) : (
        items.map((item) => (
          <PressSurface
            key={item.id}
            accessibilityLabel={`${item.readAt ? '' : t('notifications.unread') + ', '}${item.title}. ${item.body}`}
            onPress={() => open(item)}
            contentStyle={[styles.item, !item.readAt && styles.unread]}
          >
            <View style={[styles.dot, item.readAt && styles.dotRead]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="callout">{item.title}</Text>
              {item.body.length > 0 && (
                <Text tone="secondary">{item.body}</Text>
              )}
              <Text variant="caption" tone="secondary">
                {formatDate(item.createdAt, { locale: i18n.language }) +
                  ' · ' +
                  formatTime(item.createdAt)}
              </Text>
            </View>
          </PressSurface>
        ))
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  inboxHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'flex-start',
    padding: spacing[12],
    borderRadius: radius[16],
  },
  unread: { backgroundColor: colors.brand.tint },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: colors.brand.primary,
  },
  dotRead: { backgroundColor: colors.transparent },
});
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
      void scheduleDailyReminders(saved.reminders).catch(() => undefined);
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
      <Inbox />
      <Text variant="headline" accessibilityRole="header">
        {t('notifications.settingsTitle')}
      </Text>
      {query.data ? (
        <>
          {(['reminders', 'cashbackUpdates', 'partnerUpdates'] as const).map(
            (name) => (
              <View key={name} style={{ gap: spacing[8] }}>
                <Text>{t(`profile.${name}`)}</Text>
                <Switch
                  label={t(`profile.${name}`)}
                  value={query.data[name]}
                  disabled={busy}
                  onValueChange={(value) => change(name, value)}
                />
              </View>
            ),
          )}
          <Text variant="caption">{t('profile.notificationConsent')}</Text>
          {remotePushAvailable() === false && (
            <Text variant="caption" tone="secondary">
              {t('notifications.localOnly')}
            </Text>
          )}
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
