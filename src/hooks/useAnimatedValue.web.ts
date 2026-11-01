import { useState } from 'react';
import { Animated } from 'react-native';

/** react-native-web 0.21 has Animated.Value but does not export the native hook. */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
