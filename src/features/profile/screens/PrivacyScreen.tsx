import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { ListRow } from '@/components/ui/ListRow';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { env } from '@/lib/env';
import { authOperation } from '@/lib/auth-lifecycle';
import { readCrashConsent, saveCrashConsent } from '@/lib/preferences';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/providers/ToastProvider';
import { spacing } from '@/design';
import { ProfilePage } from '../components/ProfilePage';
import { DeleteAccountFlow } from '../components/DeleteAccountFlow';
export default function PrivacyScreen() {
  const { t } = useTranslation();
  const user = useProfile();
  const toast = useToast();
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const lock = useRef(false);
  const deletionBusy = useRef(false);
  useEffect(() => {
    let active = true;
    if (user.data)
      void readCrashConsent(user.data.id)
        .then((value) => {
          if (active) {
            setConsent(value);
            setReady(true);
          }
        })
        .catch(() => {
          if (active) toast(t('errors.generic'));
        });
    return () => {
      active = false;
    };
  }, [user.data?.id, user.data, toast, t]);
  const toggle = async (value: boolean) => {
    if (lock.current || !user.data) return;
    lock.current = true;
    setBusy(true);
    const epoch = authOperation.epoch();
    try {
      await saveCrashConsent(user.data.id, value);
      if (authOperation.current(epoch)) setConsent(value);
    } catch {
      toast(t('errors.generic'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const open = (url: string) => {
    void WebBrowser.openBrowserAsync(url).catch(() =>
      toast(t('errors.generic')),
    );
  };
  return (
    <ProfilePage title={t('profile.privacy')}>
      <ListRow
        title={t('profile.privacyPolicy')}
        onPress={() => open(env.EXPO_PUBLIC_PRIVACY_URL)}
      />
      <ListRow
        title={t('profile.terms')}
        onPress={() => open(env.EXPO_PUBLIC_TERMS_URL)}
      />
      <Text variant="headline" accessibilityRole="header">
        {t('profile.dataTitle')}
      </Text>
      <Text>{t('profile.dataBody')}</Text>
      <View style={{ gap: spacing[12] }}>
        <Text>{t('profile.crashReports')}</Text>
        <Switch
          label={t('profile.crashReports')}
          value={consent}
          disabled={!ready || busy}
          onValueChange={(value) => {
            void toggle(value);
          }}
        />
        <Text variant="caption">{t('profile.crashBody')}</Text>
      </View>
      <Button
        variant="destructive"
        label={t('profile.deleteAccount')}
        disabled={!user.data}
        onPress={() => setDeleting(true)}
      />
      <Modal
        testID="account-deletion-modal"
        transparent
        visible={deleting}
        onRequestClose={() => {
          if (!deletionBusy.current) setDeleting(false);
        }}
      >
        {user.data && deleting && (
          <DeleteAccountFlow
            user={user.data}
            onBusyChange={(value) => {
              deletionBusy.current = value;
            }}
            onClose={() => setDeleting(false)}
          />
        )}
      </Modal>
    </ProfilePage>
  );
}
