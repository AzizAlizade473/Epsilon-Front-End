import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { colors, spacing, typography } from '@/design';

export function OfflineBanner({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [height, setHeight] = useState<number>(
    typography.caption.lineHeight + spacing[16],
  );
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useEffect(() => {
    let unsubscribe = () => {};
    const frame = requestAnimationFrame(() => {
      NetInfo.configure({
        useNativeReachability: true,
        reachabilityShouldRun: () => false,
      });
      unsubscribe = NetInfo.addEventListener((state) => {
        const disconnected =
          state.isConnected === false || state.isInternetReachable === false;
        onlineManager.setOnline(!disconnected);
        setOffline(disconnected);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);
  return (
    <View style={[styles.fill, { paddingTop: offline ? height : 0 }]}>
      {children}
      {offline && (
        <View
          style={[styles.banner, { top: insets.top }]}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        >
          <Text
            variant="caption"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {t('navigation.offline')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.screenMargin,
    paddingVertical: spacing[8],
    backgroundColor: colors.warningTint,
  },
});
