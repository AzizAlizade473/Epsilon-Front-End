import {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';
import { motionTokens } from '@/design';

/** Strong ease-out: fast start, long soft settle (no overshoot on non-gesture motion). */
export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

/** Short rise + fade for auth content; Reduce Motion keeps it instant. */
export const enter = (order: number) =>
  FadeInDown.duration(motionTokens.authEnterDuration)
    .delay(order * motionTokens.authEnterStagger)
    .easing(easeOut)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: motionTokens.authEnterRise }],
    })
    .reduceMotion(ReduceMotion.System);

export const labelFade = FadeIn.duration(motionTokens.authLabelFade)
  .easing(easeOut)
  .reduceMotion(ReduceMotion.System);
