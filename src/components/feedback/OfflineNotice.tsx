import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';

export function useOnline() {
  return useSyncExternalStore(
    (change) => onlineManager.subscribe(change),
    () => onlineManager.isOnline(),
  );
}

/**
 * Shown only without a network. `saved` says whether this screen has content to
 * show; without it the notice must not suggest there is a saved copy.
 */
export function OfflineNotice({ saved }: { saved: boolean }) {
  const online = useOnline();
  const { t } = useTranslation();
  if (online) return null;
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Icon icon={WifiOff} size="small" decorative />
      <Text variant="caption" style={styles.text}>
        {t(saved ? 'offline.saved' : 'offline.notSaved')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.warningTint,
  },
  text: { flex: 1 },
});
