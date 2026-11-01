import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View, useAnimatedValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { colors, layout, spacing, typography, useMotion } from '@/design';

export function OfflineBanner({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'online' | 'offline' | 'reconnected'>(
    'online',
  );
  const wasOffline = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translate = useAnimatedValue(0);
  const motion = useMotion();
  const visible = status !== 'online';
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
        if (disconnected) {
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          wasOffline.current = true;
          setStatus('offline');
        } else if (wasOffline.current) {
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          wasOffline.current = false;
          setStatus('reconnected');
          reconnectTimer.current = setTimeout(
            () => setStatus('online'),
            layout.reconnectDuration,
          );
        }
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      onlineManager.setOnline(true);
    };
  }, []);
  useEffect(() => {
    if (!visible) return;
    translate.setValue(motion.reduceMotion ? 0 : -height);
    const animation = Animated.timing(translate, {
      toValue: 0,
      duration: motion.duration.normal,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, translate, height, motion.reduceMotion, motion.duration.normal]);
  return (
    <View style={[styles.fill, { paddingTop: visible ? height : 0 }]}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.banner,
            {
              top: insets.top,
              transform: [{ translateY: translate }],
              backgroundColor:
                status === 'reconnected'
                  ? colors.successTint
                  : colors.warningTint,
            },
          ]}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        >
          <Text
            variant="caption"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={
              status === 'reconnected'
                ? { color: colors.successInk }
                : undefined
            }
          >
            {t(
              status === 'offline'
                ? 'navigation.offline'
                : 'resilience.reconnected',
            )}
          </Text>
        </Animated.View>
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
