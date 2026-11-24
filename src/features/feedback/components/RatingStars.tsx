import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { selectionAsync } from 'expo-haptics';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Star from 'lucide-react-native/icons/star';
import { colors } from '@/design';
import { decorativeSvgProps } from '@/lib/decorative-svg';

const SIZE = 44;

function RatingStar({
  index,
  value,
  disabled,
  onRate,
}: {
  index: number;
  value: number;
  disabled: boolean;
  onRate: (rating: number) => void;
}) {
  const { t } = useTranslation();
  const filled = index <= value;
  const scale = useSharedValue(1);
  useEffect(() => {
    // The chosen star and the ones before it settle in with one small, quick pop.
    if (!filled) return;
    scale.set(
      withSequence(
        withTiming(1.18, {
          duration: 90 + index * 25,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(1, { duration: 140, reduceMotion: ReduceMotion.System }),
      ),
    );
  }, [filled, value, index, scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={t('feedback.starChoice', {
        count: index,
        meaning: t(`rate.label.${index}`),
      })}
      accessibilityState={{ checked: value === index, disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={() => {
        if (Platform.OS !== 'web') void selectionAsync().catch(() => undefined);
        onRate(index);
      }}
      style={styles.target}
    >
      <Animated.View style={style}>
        <Star
          size={SIZE}
          strokeWidth={1.25}
          color={filled ? colors.rating.filled : colors.rating.outline}
          fill={filled ? colors.rating.filled : 'transparent'}
          {...decorativeSvgProps}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Five large stars; every rating is equally easy to give and none is styled as "bad". */
export function RatingStars({
  value,
  onRate,
  disabled = false,
}: {
  value: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('feedback.question')}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <RatingStar
          key={index}
          index={index}
          value={value}
          disabled={disabled}
          onRate={onRate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 2 },
  target: {
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
