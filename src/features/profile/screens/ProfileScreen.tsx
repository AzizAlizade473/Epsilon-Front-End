import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import UserRound from 'lucide-react-native/icons/user-round';
import MessageSquare from 'lucide-react-native/icons/message-square';
import Bell from 'lucide-react-native/icons/bell';
import Languages from 'lucide-react-native/icons/languages';
import Shield from 'lucide-react-native/icons/shield';
import CircleHelp from 'lucide-react-native/icons/circle-question-mark';
import Pencil from 'lucide-react-native/icons/pencil';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ListRow } from '@/components/ui/ListRow';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { DevScenarioMenu } from '@/components/dev/dev-scenario-menu';
import { colors, layout, radius, spacing } from '@/design';
import { useProfile, useReviews } from '@/hooks/useProfile';
import { maskedPhone } from '@/lib/profile';
import { useAuthActions } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useProfile();
  const reviews = useReviews();
  const { logout } = useAuthActions();
  const toast = useToast();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dev, setDev] = useState(false);
  const lock = useRef(false);
  const account = [
    ['personal-info', UserRound, 'personal'],
    ['my-reviews', MessageSquare, 'reviews'],
    ['notifications', Bell, 'notifications'],
    ['language', Languages, 'language'],
  ] as const;
  const support = [
    ['privacy', Shield, 'privacy'],
    ['help', CircleHelp, 'help'],
  ] as const;
  const row = ([route, icon, key]:
    (typeof account)[number] | (typeof support)[number]) => (
    <ListRow
      key={route}
      title={t(`profile.${key}`)}
      icon={icon}
      value={
        key === 'language'
          ? i18n.language.toUpperCase()
          : key === 'reviews' && reviews.data
            ? `${reviews.data.items.length}${reviews.hasNextPage ? '+' : ''}`
            : undefined
      }
      onPress={() => router.push(`/profile/${route}` as Href)}
    />
  );
  const signOut = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await logout();
      router.replace('/welcome');
    } catch {
      toast(t('profile.logoutLocal'));
      router.replace('/welcome');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen title={t('navigation.profile')} edges={['top', 'left', 'right']}>
      <View style={styles.identity}>
        <Pressable
          disabled={!__DEV__}
          accessibilityRole={__DEV__ ? 'button' : undefined}
          accessibilityLabel={t('profile.brand')}
          onLongPress={() => {
            if (__DEV__) setDev(true);
          }}
          style={styles.avatar}
        >
          <Text variant="title2" style={styles.brand}>
            {user.data?.firstName?.slice(0, 1) || t('profile.mark')}
          </Text>
        </Pressable>
        <View style={styles.copy}>
          <Text variant="title2">
            {[user.data?.firstName, user.data?.lastName]
              .filter(Boolean)
              .join(' ')}
          </Text>
          <Text variant="caption" style={styles.identityMeta}>
            {maskedPhone(user.data?.phone ?? null) || user.data?.email}
          </Text>
        </View>
        <IconButton
          icon={Pencil}
          accessibilityLabel={t('profile.edit')}
          onPress={() => router.push('/profile/personal-info')}
        />
      </View>
      <Text variant="caption" tone="secondary">
        {t('visual.profileNote')}
      </Text>
      {user.isError && (
        <>
          <Text tone="danger">{t('errors.generic')}</Text>
          <Button
            label={t('common.retry')}
            variant="ghost"
            onPress={() => {
              void user.refetch();
            }}
          />
        </>
      )}
      <Text variant="caption" accessibilityRole="header">
        {t('profile.account')}
      </Text>
      <View style={styles.group}>{account.map(row)}</View>
      <Text variant="caption" accessibilityRole="header">
        {t('profile.security')}
      </Text>
      <View style={styles.group}>{support.map(row)}</View>
      <Button
        variant="outline"
        label={t('profile.logout')}
        onPress={() => setConfirm(true)}
      />
      <Text variant="caption">
        {t('profile.version', { version: Constants.expoConfig?.version ?? '' })}
      </Text>
      <Modal
        transparent
        visible={confirm}
        onRequestClose={() => {
          if (!busy) setConfirm(false);
        }}
      >
        <Sheet
          onClose={() => setConfirm(false)}
          onBeforeClose={() => !lock.current}
          accessibilityLabel={t('profile.logout')}
        >
          <View style={styles.dialog}>
            <Text variant="title2">{t('profile.logoutConfirm')}</Text>
            <Button
              variant="destructive"
              label={t('profile.logoutAction')}
              loading={busy}
              onPress={() => {
                void signOut();
              }}
            />
            <Button
              variant="ghost"
              label={t('common.cancel')}
              disabled={busy}
              onPress={() => setConfirm(false)}
            />
          </View>
        </Sheet>
      </Modal>
      {__DEV__ && (
        <DevScenarioMenu
          visible={dev}
          onClose={() => setDev(false)}
          onSelectScenario={() => {
            void client.invalidateQueries();
          }}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[20],
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    borderRadius: radius[24],
  },
  avatar: {
    width: layout.profileAvatarSize,
    height: layout.profileAvatarSize,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.brand.primary },
  identityMeta: { color: colors.inkSecondary },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius[20],
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing[16],
  },
  dialog: { gap: spacing[16] },
});
