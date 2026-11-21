import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Star from 'lucide-react-native/icons/star';
import { Text } from '@/components/ui/Text';
import { colors, layout, motionTokens, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/** Structural rating summary shared by dishes and retail products. */
export type RatingSummary = {
  average: number;
  count: number;
  /** Counts for 5, 4, 3, 2, 1 stars in that order. */
  distribution: readonly number[];
};

const sizes = { small: 14, medium: 18, large: 22 } as const;

/** Read-only star display. Never a control: rating lives in the receipt flow. */
export const Stars = memo(function Stars({
  value,
  size = 'small',
}: {
  value: number;
  size?: keyof typeof sizes;
}) {
  const { t } = useTranslation();
  const filled = Math.round(value);
  return (
    <View
      style={styles.stars}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('dining.scoreLabel', { score: value.toFixed(1) })}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={sizes[size]}
          strokeWidth={layout.iconStrokeWidth}
          color={n <= filled ? colors.brand.accent : colors.brand.border}
          fill={n <= filled ? colors.brand.accent : colors.transparent}
          {...decorativeSvgProps}
        />
      ))}
    </View>
  );
});

/** "★ 4.8 (212)" compact score used on cards. */
export function ScoreLine({
  rating,
  inverse = false,
}: {
  rating: Pick<RatingSummary, 'average' | 'count'>;
  inverse?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View
      style={styles.score}
      accessible
      accessibilityLabel={`${t('dining.scoreLabel', { score: rating.average.toFixed(1) })}, ${t('dining.ratings', { count: rating.count })}`}
    >
      <Star
        size={sizes.small}
        strokeWidth={layout.iconStrokeWidth}
        color={inverse ? colors.surface : colors.brand.accent}
        fill={inverse ? colors.surface : colors.brand.accent}
        {...decorativeSvgProps}
      />
      <Text variant="callout" tone={inverse ? 'inverse' : 'default'}>
        {rating.average.toFixed(1)}
      </Text>
      <Text variant="caption" tone={inverse ? 'inverse' : 'secondary'}>
        ({rating.count})
      </Text>
    </View>
  );
}

const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
function Bar({ share, order }: { share: number; order: number }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? share : 0);
  useEffect(() => {
    grow.set(
      reduced
        ? share
        : withDelay(
            order * motionTokens.listStagger,
            withTiming(share, {
              duration: motionTokens.authEnterDuration,
              easing: easeOut,
            }),
          ),
    );
  }, [grow, share, order, reduced]);
  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: grow.get() }],
  }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

/** Distribution bars, 5★ first. Rows are pressable when `onSelect` is given. */
export function RatingBars({
  rating,
  selected = null,
  onSelect,
}: {
  rating: RatingSummary;
  selected?: number | null;
  onSelect?: (stars: number) => void;
}) {
  const { t } = useTranslation();
  const max = Math.max(1, rating.count);
  return (
    <View style={styles.bars} accessibilityLabel={t('dining.distribution')}>
      {rating.distribution.map((count, index) => {
        const stars = 5 - index;
        const label = t('dining.starRow', { stars, count });
        const row = (
          <View
            style={[
              styles.row,
              selected !== null && selected !== stars && styles.dim,
            ]}
          >
            <View style={styles.rowStar}>
              <Text variant="caption">{stars}</Text>
              <Star
                size={12}
                strokeWidth={layout.iconStrokeWidth}
                color={colors.brand.accent}
                fill={colors.brand.accent}
                {...decorativeSvgProps}
              />
            </View>
            <Bar share={count / max} order={index} />
            <Text variant="caption" tone="secondary" style={styles.count}>
              {count}
            </Text>
          </View>
        );
        return onSelect ? (
          <Pressable
            key={stars}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: selected === stars }}
            onPress={() => onSelect(stars)}
            style={styles.pressRow}
          >
            {row}
          </Pressable>
        ) : (
          <View key={stars} accessible accessibilityLabel={label}>
            {row}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 2 },
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  bars: { gap: spacing[4], flex: 1 },
  pressRow: { minHeight: layout.tapTarget / 1.5, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: 24,
  },
  dim: { opacity: 0.4 },
  rowStar: {
    width: premium.barLabel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  track: {
    flex: 1,
    height: premium.barHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    transformOrigin: 'left',
  },
  count: { minWidth: premium.barLabel + spacing[8], textAlign: 'right' },
});
