import X from 'lucide-react-native/icons/x';
import { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing, useMotion } from '@/design';

export type ToastProps = {
  visible: boolean;
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
};

/** The provider owns queueing, positioning and dismissal timing (STEP 21). */
export function Toast({
  visible,
  message,
  dismissLabel,
  onDismiss,
}: ToastProps) {
  const opacity = useAnimatedValue(0);
  const { reduceMotion, duration, easing } = useMotion();
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: duration.normal,
      easing,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, visible, reduceMotion, duration.normal, easing]);
  if (!visible) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text
        style={styles.message}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
      <IconButton
        icon={X}
        tone="inverse"
        accessibilityLabel={dismissLabel}
        onPress={onDismiss}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radius[16],
    backgroundColor: colors.ink,
  },
  message: { flex: 1, minWidth: 0, color: colors.surface },
});
