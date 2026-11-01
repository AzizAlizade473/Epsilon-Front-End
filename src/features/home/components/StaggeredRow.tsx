import { useEffect, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useMotion } from '@/design';

export function StaggeredRow({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const opacity = useAnimatedValue(1);
  const played = useRef(false);
  const motion = useMotion();
  useEffect(() => {
    if (played.current || motion.reduceMotion) return;
    played.current = true;
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: motion.duration.normal,
      delay: index * motion.listStagger,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(1);
    };
  }, [
    index,
    motion.reduceMotion,
    motion.duration.normal,
    motion.listStagger,
    opacity,
  ]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
