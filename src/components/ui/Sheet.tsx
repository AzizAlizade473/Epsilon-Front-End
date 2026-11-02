/* eslint-disable react-hooks/immutability -- Reanimated shared values require .value mutation */
/* eslint-disable react-hooks/refs -- Reanimated gesture worklets capture refs by design */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { focusAccessible } from '@/lib/focus-accessible';

import {
  colors,
  layout,
  motionTokens,
  radius,
  spacing,
  useMotion,
} from '@/design';

export type SheetProps = {
  children: React.ReactNode;
  onClose: () => void;
  onBeforeClose?: () => boolean;
  visible?: boolean;
  accessibilityLabel?: string;
};

export function Sheet(props: SheetProps) {
  return props.visible === false ? null : <SheetBody {...props} />;
}
function SheetBody({
  children,
  onClose,
  onBeforeClose,
  visible = true,
  accessibilityLabel,
}: SheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useMotion();
  const [sheetHeight, setSheetHeight] = useState(360);
  const closingRef = useRef(false);
  const mounted = useRef(true);
  const handle = useRef<ComponentRef<typeof View>>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(sheetHeight);
  const finishClose = useCallback(() => {
    if (mounted.current) onClose();
  }, [onClose]);
  useEffect(() => {
    mounted.current = true;
    const frame = requestAnimationFrame(() => {
      focusAccessible(handle.current);
    });
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame);
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [opacity, translateY]);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    if (onBeforeClose && !onBeforeClose()) {
      translateY.value = reduceMotion ? 0 : withSpring(0, motionTokens.spring);
      return;
    }
    closingRef.current = true;
    if (reduceMotion) {
      opacity.value = withTiming(
        0,
        { duration: motionTokens.duration.normal },
        () => {
          runOnJS(finishClose)();
        },
      );
    } else {
      opacity.value = withTiming(0, { duration: motionTokens.duration.normal });
      translateY.value = withTiming(
        sheetHeight,
        { duration: motionTokens.duration.normal },
        () => {
          runOnJS(finishClose)();
        },
      );
    }
  }, [
    finishClose,
    onBeforeClose,
    reduceMotion,
    sheetHeight,
    opacity,
    translateY,
  ]);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      if (reduceMotion) {
        opacity.value = withTiming(1, {
          duration: motionTokens.duration.normal,
        });
        translateY.value = 0;
      } else {
        opacity.value = withTiming(1, {
          duration: motionTokens.duration.normal,
        });
        translateY.value = withSpring(0, {
          damping: 24,
          stiffness: 240,
          mass: 1,
        });
      }
    }
  }, [visible, reduceMotion, opacity, translateY]);

  useEffect(() => {
    if (!visible) dismiss();
  }, [visible, dismiss]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        dismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [dismiss]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY > 80 || event.velocityY > 600) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, {
          damping: 24,
          stiffness: 240,
          mass: 1,
        });
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? opacity.value : 1,
    transform: [{ translateY: reduceMotion ? 0 : translateY.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    if (height > 0) setSheetHeight(height);
  };

  return (
    <GestureHandlerRootView
      style={[styles.root, { paddingTop: insets.top }]}
      accessibilityViewIsModal
      accessibilityRole="alert"
    >
      <Animated.View style={[styles.backdrop, overlayStyle]}>
        <Pressable
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
        />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            onLayout={handleLayout}
            accessibilityLabel={accessibilityLabel}
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing[16]) },
              sheetAnimatedStyle,
            ]}
          >
            <Pressable
              ref={handle}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.close')}
              onPress={dismiss}
              style={styles.handleContainer}
            >
              <View style={styles.handle} />
            </Pressable>
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  keyboardContainer: {
    maxHeight: '100%',
    flexShrink: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  sheet: {
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius[20],
    borderTopRightRadius: radius[20],
    borderTopWidth: layout.hairlineWidth,
    borderTopColor: colors.border,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.screenMargin,
  },
  handleContainer: {
    minHeight: layout.tapTarget,
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  content: {
    flexShrink: 1,
    paddingBottom: spacing[12],
  },
});
