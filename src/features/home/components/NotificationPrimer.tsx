import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import BellRing from 'lucide-react-native/icons/bell-ring';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/design';
import { services } from '@/services';
import {
  enableDeviceNotifications,
  readNotificationPermission,
} from '@/services/notification-device';
import { scheduleDailyReminders } from '@/services/local-reminders';

export const PRIMER_KEY = 'epsilon.notifications.asked';
/** Lets the launch intro and Home settle before asking anything. */
const DELAY_MS = 1500;

/**
 * Asks once, in Epsilon's words, before the system dialog. Declining is
 * remembered and never asked again here (Profile → Notifications can turn it
 * on later). On every start, the daily reminders are rescheduled from the
 * saved preference so they never pile up or outlive a change.
 */
export function NotificationPrimer() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    if (Platform.OS === 'web') return;
    const timer = setTimeout(() => {
      void (async () => {
        const granted = await readNotificationPermission().catch(() => false);
        if (granted) {
          const prefs = await services.notification.settings();
          await scheduleDailyReminders(prefs.reminders);
          return;
        }
        const asked = await AsyncStorage.getItem(PRIMER_KEY).catch(() => '1');
        if (!asked && active.current) setVisible(true);
      })().catch(() => undefined);
    }, DELAY_MS);
    return () => {
      active.current = false;
      clearTimeout(timer);
    };
  }, []);
  const finish = () => {
    setVisible(false);
    void AsyncStorage.setItem(PRIMER_KEY, '1').catch(() => undefined);
  };
  const enable = async () => {
    setBusy(true);
    try {
      if (await enableDeviceNotifications()) {
        const prefs = {
          cashbackUpdates: true,
          partnerUpdates: true,
          reminders: true,
        };
        await services.notification
          .updatePreferences(prefs)
          .catch(() => undefined);
        await scheduleDailyReminders(true);
      }
    } catch {
      // The system dialog may fail on odd devices; the app stays fully usable.
    } finally {
      if (active.current) {
        setBusy(false);
        finish();
      }
    }
  };
  return (
    <Modal transparent visible={visible} onRequestClose={finish}>
      <Sheet
        accessibilityLabel={t('notifications.primerTitle')}
        onClose={finish}
      >
        <View style={styles.body}>
          <View style={styles.mark}>
            <Icon icon={BellRing} color={colors.brand.primary} decorative />
          </View>
          <Text variant="title2" accessibilityRole="header">
            {t('notifications.primerTitle')}
          </Text>
          <Text tone="secondary">{t('notifications.primerBody')}</Text>
          <Button
            label={t('notifications.primerAllow')}
            loading={busy}
            onPress={() => {
              void enable();
            }}
          />
          <Button
            variant="ghost"
            label={t('notifications.primerLater')}
            disabled={busy}
            onPress={finish}
          />
        </View>
      </Sheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[12] },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius[16],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.tint,
  },
});
