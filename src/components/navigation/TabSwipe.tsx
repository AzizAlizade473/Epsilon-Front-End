import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { spacing } from '@/design';

/** Swipe order matches the pill; Scan is a deliberate action, never swiped into. */
export const swipeOrder = ['home', 'restaurants', 'profile'] as const;

const commitDistance = 72;
const commitVelocity = 600;
const maxDrag = spacing[48];
const settle = { duration: 320, dampingRatio: 1 } as const;

// One finger, one swipe at a time: a module flag is enough for the web click guard.
let swipeActive = false;
function markSwiping(value: boolean) {
  if (value) swipeActive = true;
  else setTimeout(() => (swipeActive = false), 0);
}

/** Pure decision so the threshold logic is testable without gestures. */
export function swipeTarget(
  current: string,
  translationX: number,
  velocityX: number,
): string | null {
  'worklet';
  const index = swipeOrder.indexOf(current as (typeof swipeOrder)[number]);
  if (index < 0) return null;
  const committed =
    Math.abs(translationX) > commitDistance ||
    Math.abs(velocityX) > commitVelocity;
  if (!committed) return null;
  // Finger moving left reveals the next tab, like a pager.
  const next = translationX < 0 ? index + 1 : index - 1;
  return swipeOrder[next] ?? null;
}

/**
 * Horizontal swipe between tabs. Content follows the finger with resistance
 * (capped), then springs home while the tab's own fade handles the switch.
 * Vertical scroll wins quickly (failOffsetY), so lists keep scrolling.
 */
export function TabSwipe({
  route,
  onSwipe,
  children,
}: {
  route: string;
  onSwipe: (target: string) => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const dragX = useSharedValue(0);
  const enabled = swipeOrder.includes(route as (typeof swipeOrder)[number]);
  // Web only: a drag that started on a row must not also "click" it on release.
  // Native gesture-handler cancels the JS press itself when the pan activates.
  const host = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = host.current as unknown as HTMLElement | null;
    const swallow = (event: MouseEvent) => {
      if (!swipeActive) return;
      event.stopPropagation();
      event.preventDefault();
    };
    // Browser image drag-and-drop would otherwise steal swipes that start on photos.
    const noDrag = (event: DragEvent) => event.preventDefault();
    node?.addEventListener('click', swallow, true);
    node?.addEventListener('dragstart', noDrag, true);
    return () => {
      node?.removeEventListener('click', swallow, true);
      node?.removeEventListener('dragstart', noDrag, true);
    };
  }, []);
  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-spacing[24], spacing[24]])
    .failOffsetY([-spacing[12], spacing[12]])
    .onStart(() => {
      scheduleOnRN(markSwiping, true);
    })
    .onUpdate((event) => {
      if (reduced) return;
      const resisted = event.translationX * 0.25;
      dragX.set(Math.max(-maxDrag, Math.min(maxDrag, resisted)));
    })
    .onEnd((event) => {
      const target = swipeTarget(route, event.translationX, event.velocityX);
      if (target) scheduleOnRN(onSwipe, target);
      dragX.set(withSpring(0, { ...settle, velocity: event.velocityX * 0.25 }));
    })
    .onFinalize(() => {
      scheduleOnRN(markSwiping, false);
      if (dragX.get() !== 0) dragX.set(withSpring(0, settle));
    });
  const follow = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.get() }],
  }));
  return (
    <GestureHandlerRootView style={styles.fill}>
      <GestureDetector gesture={pan}>
        <Animated.View ref={host} style={[styles.fill, follow]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
