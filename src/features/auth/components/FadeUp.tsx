import { useEffect, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { spacing, useMotion } from '@/design';

export function FadeUp({
  order,
  children,
}: {
  order: number;
  children: ReactNode;
}) {
  const progress = useAnimatedValue(0);
  const motion = useMotion();
  useEffect(() => {
    if (motion.reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.normal,
      delay: order * motion.listStagger,
      easing: motion.easing,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [
    motion.reduceMotion,
    motion.duration.normal,
    motion.listStagger,
    motion.easing,
    order,
    progress,
  ]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [spacing[8], 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
