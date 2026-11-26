import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Heart from 'lucide-react-native/icons/heart';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, motionTokens, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { useLike } from '@/hooks/useLikes';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import type { LikeTarget } from '@/hooks/likeTargets';

/**
 * The only like control. `overlay` sits on photography; `inline` is the quiet
 * heart with a count under a review or in a list row.
 */
export function LikeButton({
  target,
  variant = 'inline',
}: {
  target: LikeTarget;
  variant?: 'inline' | 'overlay';
}) {
  const { t } = useTranslation();
  const { liked, count, toggle } = useLike(target);
  const overlay = variant === 'overlay';
  const scale = useSharedValue(1);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const color = overlay
    ? colors.surface
    : liked
      ? colors.brand.primary
      : colors.inkSecondary;
  return (
    <PressSurface
      accessibilityLabel={`${t(liked ? 'likes.unlike' : 'likes.like', {
        name: target.snapshot.title,
      })}, ${t('likes.count', { count })}`}
      accessibilityState={{ selected: liked }}
      style={styles.surface}
      contentStyle={overlay ? styles.overlay : styles.inline}
      onPress={() => {
        if (!liked)
          scale.set(
            withSequence(
              withTiming(1.25, {
                duration: motionTokens.duration.fast,
                reduceMotion: ReduceMotion.System,
              }),
              withSpring(1, {
                ...motionTokens.spring,
                reduceMotion: ReduceMotion.System,
              }),
            ),
          );
        toggle();
      }}
    >
      <View style={styles.row}>
        <Animated.View style={pop}>
          <Heart
            size={spacing[20]}
            strokeWidth={layout.iconStrokeWidth}
            color={color}
            fill={liked ? color : colors.transparent}
            {...decorativeSvgProps}
          />
        </Animated.View>
        {!overlay && count > 0 && (
          <Text variant="caption" style={{ color }}>
            {count}
          </Text>
        )}
      </View>
    </PressSurface>
  );
}
const styles = StyleSheet.create({
  surface: { borderRadius: radius.pill, overflow: 'hidden' },
  inline: { paddingHorizontal: spacing[8], borderRadius: radius.pill },
  overlay: {
    width: layout.tapTarget,
    height: layout.tapTarget,
    borderRadius: radius.pill,
    backgroundColor: premium.scrim,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
});
