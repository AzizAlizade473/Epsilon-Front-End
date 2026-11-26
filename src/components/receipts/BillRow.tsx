import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import Clock from 'lucide-react-native/icons/clock';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Star from 'lucide-react-native/icons/star';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { billCashback, billIdentity, billRatings } from '@/hooks/billView';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import { formatMoney } from '@/lib/money';
import type { Receipt } from '@/services/contracts';

const LOGO = 56;
const NOTCH = 14;
/** More dishes than this share the marks proportionally. */
const MARKS = 6;

/**
 * One remembered visit: the restaurant first, then when and how much; below the
 * receipt's perforation, what the visit earned and which dishes were rated.
 */
export function BillRow({
  receipt,
  onPress,
  order = 0,
  behind = o.colors.canvas,
}: {
  receipt: Receipt;
  onPress: () => void;
  /** Position on screen, for the entrance cascade. */
  order?: number;
  /** The colour around the card: the perforation notches are cut in it. */
  behind?: string;
}) {
  const { t, i18n } = useTranslation();
  const { name, logoName } = billIdentity(receipt);
  const ratings = billRatings(receipt);
  const cashback = billCashback(receipt);
  const complete = ratings.total > 0 && ratings.done === ratings.total;
  const date = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(receipt.issuedAt));
  const visit = `${date} · ${t('originalReceipts.dishes', { count: receipt.items.length })}`;

  const reward = (() => {
    if (cashback && 'amountMinor' in cashback) {
      const amount = formatMoney(cashback.amountMinor);
      if (cashback.kind === 'earned')
        return {
          icon: BadgeCheck,
          color: o.colors.rated,
          text: t('bills.earned', { amount }),
        };
      if (cashback.kind === 'pending')
        return {
          icon: Clock,
          color: o.colors.pending,
          text: t('bills.pendingAmount', { amount }),
        };
      return {
        icon: Sparkles,
        color: colors.brand.primary,
        text: t('bills.available', { amount }),
      };
    }
    if (cashback?.kind === 'partner')
      return {
        icon: Sparkles,
        color: colors.brand.primary,
        text: t('bills.partnerHint'),
      };
    if (cashback?.kind === 'nonPartner')
      return {
        icon: MessageCircle,
        color: o.colors.secondary,
        text: t('bills.nonPartner'),
      };
    return {
      icon: ReceiptText,
      color: o.colors.secondary,
      text:
        receipt.status !== 'verified'
          ? t('receipt.status.' + receipt.status)
          : complete
            ? t('bills.thanks')
            : t('bills.saved'),
    };
  })();
  const rated = !ratings.total
    ? null
    : complete
      ? t('bills.yourRating', { rating: ratings.average!.toFixed(1) })
      : t('bills.toRate', { count: ratings.total - ratings.done });
  const marks = Math.min(ratings.total, MARKS);
  const filled = ratings.total
    ? Math.round((ratings.done / ratings.total) * marks)
    : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(280)
        .delay(Math.min(order, 6) * 45)
        .reduceMotion(ReduceMotion.System)}
      style={styles.wrap}
    >
      <PressSurface
        accessibilityLabel={[
          name,
          visit,
          formatMoney(receipt.totalMinor),
          reward.text,
          rated,
        ]
          .filter(Boolean)
          .join(', ')}
        onPress={onPress}
        spring
        style={styles.card}
        contentStyle={styles.content}
      >
        <View style={styles.top}>
          <BrandBadge
            name={logoName}
            logoUrl={receipt.restaurant.logoUrl}
            size={LOGO}
          />
          <View style={styles.who}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.visit} numberOfLines={1}>
              {visit}
            </Text>
          </View>
          <Text style={styles.total}>{formatMoney(receipt.totalMinor)}</Text>
        </View>
        <View style={styles.seam}>
          <View
            style={[styles.notch, styles.left, { backgroundColor: behind }]}
          />
          <View style={styles.dash} />
          <View
            style={[styles.notch, styles.right, { backgroundColor: behind }]}
          />
        </View>
        <Animated.View
          entering={FadeIn.duration(320)
            .delay(180 + Math.min(order, 6) * 45)
            .reduceMotion(ReduceMotion.System)}
          style={styles.bottom}
        >
          <View style={styles.reward}>
            <Icon
              icon={reward.icon}
              size="small"
              color={reward.color}
              decorative
            />
            <Text style={[styles.rewardText, { color: reward.color }]}>
              {reward.text}
            </Text>
          </View>
          {rated &&
            (complete ? (
              <View style={styles.score}>
                <Star
                  size={spacing[16]}
                  strokeWidth={0}
                  fill={colors.rating.filled}
                  {...decorativeSvgProps}
                />
                <Text style={styles.scoreText}>
                  {ratings.average!.toFixed(1)}
                </Text>
              </View>
            ) : (
              <View style={styles.progress}>
                <View style={styles.marks}>
                  {Array.from({ length: marks }, (_, index) => (
                    <View
                      key={index}
                      style={[styles.mark, index < filled && styles.markDone]}
                    />
                  ))}
                </View>
                <Text style={styles.visit}>{rated}</Text>
              </View>
            ))}
        </Animated.View>
      </PressSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing[12] },
  card: {
    backgroundColor: o.colors.surface,
    borderRadius: o.radius.card,
    borderWidth: layout.borderWidth,
    borderColor: o.colors.emptyStar,
    overflow: 'hidden',
  },
  content: { alignItems: 'stretch' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[16],
    paddingBottom: spacing[8],
  },
  who: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    ...o.type.title,
    fontSize: 18,
    lineHeight: 24,
    color: o.colors.ink,
  },
  visit: { ...o.type.caption, color: o.colors.secondary },
  total: {
    ...o.type.product,
    fontSize: 16,
    color: o.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  seam: { height: NOTCH, justifyContent: 'center' },
  dash: {
    marginHorizontal: spacing[16],
    borderTopWidth: layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: o.colors.emptyStar,
  },
  notch: {
    position: 'absolute',
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    borderWidth: layout.borderWidth,
    borderColor: o.colors.emptyStar,
  },
  left: { left: -NOTCH / 2 - 1 },
  right: { right: -NOTCH / 2 - 1 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    minHeight: layout.tapTarget,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
  },
  reward: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  rewardText: { ...o.type.caption, fontWeight: '700', flexShrink: 1 },
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  scoreText: { ...o.type.product, color: o.colors.ink },
  progress: { alignItems: 'flex-end', gap: spacing[4] },
  marks: { flexDirection: 'row', gap: 3 },
  mark: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: o.colors.emptyStar,
  },
  markDone: { backgroundColor: colors.rating.filled },
});
