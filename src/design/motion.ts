import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

export const motionTokens = {
  duration: {
    fast: 120,
    normal: 200,
    slow: 320,
  },
  easing: Easing.out(Easing.cubic),
  spring: {
    damping: 20,
    stiffness: 260,
    mass: 1,
  },
  pressScale: 0.97,
  listStagger: 40,
  listStaggerMax: 8,
} as const;

export type MotionConfig = {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: typeof motionTokens.easing;
  spring: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  pressScale: number;
  listStagger: number;
  listStaggerMax: number;
  reduceMotion: boolean;
};

const instantSpring = {
  damping: 1000,
  stiffness: 10_000,
  mass: 1,
} as const;

/** Pure resolver so Reduce Motion can be unit-tested without rendering. */
export function resolveMotion(reduceMotion: boolean): MotionConfig {
  if (reduceMotion) {
    return {
      duration: { fast: 0, normal: 0, slow: 0 },
      easing: motionTokens.easing,
      spring: instantSpring,
      pressScale: 1,
      listStagger: 0,
      listStaggerMax: motionTokens.listStaggerMax,
      reduceMotion: true,
    };
  }

  return {
    duration: { ...motionTokens.duration },
    easing: motionTokens.easing,
    spring: { ...motionTokens.spring },
    pressScale: motionTokens.pressScale,
    listStagger: motionTokens.listStagger,
    listStaggerMax: motionTokens.listStaggerMax,
    reduceMotion: false,
  };
}

/**
 * Returns motion values that collapse to instant when the OS Reduce Motion
 * setting is enabled.
 */
export function useMotion(): MotionConfig {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return resolveMotion(reduceMotion);
}
