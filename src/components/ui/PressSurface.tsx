import {
  AndroidHaptics,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  useAnimatedValue,
  type PressableProps,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, layout, useMotion } from '@/design';

export type PressSurfaceProps = {
  children: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  pressedColor?: ColorValue;
  pressScale?: number;
  spring?: boolean;
  accessibilityRole?: PressableProps['accessibilityRole'];
  accessibilityState?: PressableProps['accessibilityState'];
};

/** Callers keep mutation state and handle async errors before passing onPress. */
export function PressSurface({
  children,
  accessibilityLabel,
  onPress,
  disabled = false,
  loading = false,
  style,
  contentStyle,
  pressedColor,
  pressScale,
  spring = false,
  accessibilityRole = 'button',
  accessibilityState,
}: PressSurfaceProps) {
  const scale = useAnimatedValue(1);
  const motion = useMotion();
  const blocked = disabled || loading;
  const animate = (value: number) => {
    scale.stopAnimation();
    if (motion.reduceMotion) {
      scale.setValue(value);
      return;
    }
    if (spring) {
      Animated.spring(scale, {
        ...motion.spring,
        toValue: value,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(scale, {
      toValue: value,
      duration: motion.duration.fast,
      easing: motion.easing,
      useNativeDriver: true,
    }).start();
  };
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: blocked ? layout.disabledOpacity : 1,
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        accessible
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          ...accessibilityState,
          disabled: blocked,
          busy: loading,
        }}
        disabled={blocked}
        android_ripple={{ color: colors.brand.border }}
        style={({ pressed }) => [
          styles.target,
          contentStyle,
          pressed && { backgroundColor: pressedColor },
        ]}
        onPressIn={() =>
          animate(motion.reduceMotion ? 1 : (pressScale ?? motion.pressScale))
        }
        onPressOut={() => animate(1)}
        onPress={() => {
          if (blocked) return;
          const feedback =
            Platform.OS === 'android'
              ? performAndroidHapticsAsync(AndroidHaptics.Context_Click)
              : selectionAsync();
          void feedback.catch(() => undefined);
          onPress();
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  target: {
    minWidth: layout.tapTarget,
    minHeight: layout.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
