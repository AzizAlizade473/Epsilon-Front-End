import { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { colors, layout, typography, useMotion } from '@/design';
import { moneyParts } from '@/lib/money';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);
/** Animation is presentation-only; speech always announces the server amount. */
export function BalanceAmount({
  minor,
  accessibilityLabel,
  inverse = false,
}: {
  minor: number;
  accessibilityLabel: string;
  inverse?: boolean;
}) {
  const value = useSharedValue(minor);
  const previous = useRef(minor);
  const motion = useMotion();
  useEffect(() => {
    const sameWidth =
      moneyParts(previous.current).amount.length ===
      moneyParts(minor).amount.length;
    if (previous.current !== minor && sameWidth && !motion.reduceMotion) {
      value.set(withTiming(minor, { duration: motion.duration.normal }));
    } else if (previous.current !== minor || motion.reduceMotion)
      value.set(minor);
    previous.current = minor;
  }, [minor, motion.reduceMotion, motion.duration.normal, value]);
  const animatedProps = useAnimatedProps<TextInputProps>(() => {
    const integer = Math.max(
      -Number.MAX_SAFE_INTEGER,
      Math.min(Number.MAX_SAFE_INTEGER, Math.round(value.get())),
    );
    return {
      text: moneyParts(integer).amount,
      defaultValue: moneyParts(integer).amount,
    };
  });
  const parts = moneyParts(minor);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={styles.row}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text variant="display" style={styles.measure}>
          {parts.amount}
        </Text>
        <AnimatedInput
          animatedProps={animatedProps}
          defaultValue={parts.amount}
          editable={false}
          accessible={false}
          focusable={false}
          caretHidden
          showSoftInputOnFocus={false}
          allowFontScaling
          maxFontSizeMultiplier={0}
          underlineColorAndroid={colors.transparent}
          style={[
            StyleSheet.absoluteFill,
            styles.number,
            inverse && styles.inverse,
          ]}
        />
      </View>
      <Text
        variant="display"
        accessible={false}
        style={[styles.currency, inverse && styles.inverse]}
      >{` ${parts.currency}`}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  inverse: { color: colors.surface },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  measure: { opacity: 0, fontVariant: ['tabular-nums'] },
  number: {
    ...typography.display,
    padding: 0,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontSize: typography.display.fontSize * layout.currencyScale,
    lineHeight: typography.display.lineHeight * layout.currencyScale,
  },
});
