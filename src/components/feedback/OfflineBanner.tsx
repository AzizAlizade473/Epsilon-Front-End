import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Wifi from 'lucide-react-native/icons/wifi';
import WifiOff from 'lucide-react-native/icons/wifi-off';

import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
  useMotion,
} from '@/design';

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
          state.isConnected === false ||
          (Platform.OS !== 'web' && state.isInternetReachable === false);
        if (disconnected) {
          onlineManager.setOnline(false);
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          wasOffline.current = true;
          setStatus('offline');
        } else if (state.isConnected === true) {
          onlineManager.setOnline(true);
          if (!wasOffline.current) return;
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
    <View
      style={[styles.fill, { paddingTop: visible ? height + spacing[16] : 0 }]}
    >
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.banner,
            {
              top: insets.top + spacing[8],
              transform: [{ translateY: translate }],
            },
          ]}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        >
          <Icon
            icon={status === 'reconnected' ? Wifi : WifiOff}
            size="small"
            decorative
            color={
              status === 'reconnected' ? colors.successInk : colors.inkSecondary
            }
          />
          <Text
            variant="caption"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.message,
              status === 'reconnected' && { color: colors.successInk },
            ]}
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
    left: spacing.screenMargin,
    right: spacing.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    backgroundColor: colors.surface,
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius[12],
  },
  message: { flex: 1, color: colors.inkSecondary },
});
