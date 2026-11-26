import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Store from 'lucide-react-native/icons/store';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PressSurface } from '@/components/ui/PressSurface';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { ReceiptHeader } from './ReceiptHeader';
import { formatMoney } from '@/lib/money';
import type { Receipt, ReceiptItem } from '@/services/contracts';
import { DishCard } from './DishCard';
import { FiscalFooter, FiscalSummary } from './FiscalDetails';
import { NotEligibleReceipt } from './NotEligibleReceipt';

const enter = (order: number) =>
  FadeInDown.duration(260)
    .delay(order * 60)
    .reduceMotion(ReduceMotion.System);

/** Animated "n of m rated" bar; moves when a rating is saved. */
function Progress({ done, total }: { done: number; total: number }) {
  const { t } = useTranslation();
  const ratio = useSharedValue(total ? done / total : 0);
  useEffect(() => {
    ratio.set(
      withTiming(total ? done / total : 0, {
        duration: 420,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [done, total, ratio]);
  const fill = useAnimatedStyle(() => ({ width: `${ratio.get() * 100}%` }));
  return (
    <View style={styles.progress}>
      <Text style={styles.progressText} accessibilityLiveRegion="polite">
        {t('homeFocus.progress', { done, total })}
      </Text>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: done }}
      >
        <Animated.View style={[styles.fill, fill]} />
      </View>
    </View>
  );
}

/**
 * A scanned or partner receipt, built around its job: rate the dishes.
 * Order: who and when (compact) → what Epsilon offers here → the dishes →
 * the official receipt record, folded away.
 */
export function ReceiptContent({
  receipt,
  pendingIds,
  completedIds,
  onRate,
  onEdit,
  onHome,
  onClose,
  onScanAnother,
  onExplore,
}: {
  receipt: Receipt;
  pendingIds: readonly string[];
  completedIds: readonly string[];
  onRate: (item: ReceiptItem, rating?: number) => void;
  onEdit?: (item: ReceiptItem) => void;
  onHome: () => void;
  onClose?: () => void;
  onScanAnother?: () => void;
  onExplore?: () => void;
}) {
  const { t } = useTranslation();
  const [details, setDetails] = useState(false);
  const fiscal = receipt.fiscal;
  // A valid receipt from a business outside the programme — an outcome, not an error.
  if (fiscal && !fiscal.eligibility.ratingAllowed)
    return (
      <NotEligibleReceipt
        receipt={receipt}
        fiscal={fiscal}
        onHome={onHome}
        {...(onClose ? { onClose } : {})}
        {...(onScanAnother ? { onScanAnother } : {})}
        {...(onExplore ? { onExplore } : {})}
      />
    );
  const readOnly = receipt.status !== 'verified';
  const isDone = (item: ReceiptItem) =>
    item.rating !== null || completedIds.includes(item.id);
  const rateable = receipt.items.filter(
    (item) => isDone(item) || (item.canRate && !readOnly),
  );
  const done = rateable.filter(isDone).length;
  const allRated = rateable.length > 0 && done === rateable.length;
  // Nothing left to do here (all rated, queued or locked): offer the way home.
  const remaining = receipt.items.some(
    (item) =>
      !readOnly &&
      item.canRate &&
      !isDone(item) &&
      !pendingIds.includes(item.id),
  );
  const partner = fiscal ? fiscal.partner.isPartner : true;
  const cashback = fiscal ? fiscal.eligibility.cashbackAllowed : true;

  const earned = receipt.cashback?.earnedMinor ?? 0;
  const waiting = receipt.cashback?.pendingMinor ?? 0;
  const reward =
    earned || waiting
      ? {
          tone: earned ? ('earned' as const) : ('neutral' as const),
          title: earned
            ? t('bills.earnedTitle', { amount: formatMoney(earned) })
            : t('bills.pendingAmount', { amount: formatMoney(waiting) }),
          body: earned ? t('bills.earnedBody') : t('bills.pendingBody'),
        }
      : null;

  const base = readOnly
    ? {
        tone: 'muted' as const,
        title: t('receipt.status.' + receipt.status),
        body: null,
      }
    : partner && cashback
      ? {
          tone: 'partner' as const,
          title: t('receipt.partnerTitle'),
          body: receipt.rewardHint
            ? t('receipt.partnerBodyAmount', {
                amount: formatMoney(receipt.rewardHint.amountMinor),
              })
            : t('receipt.partnerBody'),
        }
      : !partner
        ? {
            tone: 'neutral' as const,
            title: t('receipt.nonPartnerTitle'),
            body: t('receipt.nonPartnerBody'),
          }
        : {
            tone: 'neutral' as const,
            title: t('receipt.nonPartnerTitle'),
            body: fiscal?.eligibility.reason
              ? t(`fiscal.reason.${fiscal.eligibility.reason}`, {
                  type: '',
                })
              : null,
          };

  // Money already recorded matters more than what could be earned.
  const status = reward ?? base;

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={enter(0)}>
        <ReceiptHeader receipt={receipt} {...(onClose ? { onClose } : {})} />
      </Animated.View>

      <Animated.View
        entering={enter(1)}
        style={[
          styles.status,
          status.tone === 'partner' && styles.statusPartner,
          status.tone === 'earned' && styles.statusEarned,
        ]}
        accessibilityRole="summary"
      >
        <Icon
          icon={
            status.tone === 'earned'
              ? BadgeCheck
              : status.tone === 'partner'
                ? Sparkles
                : Store
          }
          size="small"
          color={
            status.tone === 'earned'
              ? o.colors.rated
              : status.tone === 'partner'
                ? o.colors.primary
                : o.colors.secondary
          }
          decorative
        />
        <View style={styles.copy}>
          <Text style={styles.statusTitle}>{status.title}</Text>
          {status.body && <Text style={styles.sub}>{status.body}</Text>}
        </View>
      </Animated.View>

      {rateable.length > 0 && (
        <Animated.View entering={enter(2)} style={styles.sectionHead}>
          <Text style={styles.section} accessibilityRole="header">
            {t('receipt.rateTitle')}
          </Text>
          <Progress done={done} total={rateable.length} />
        </Animated.View>
      )}

      <View style={styles.dishes}>
        {receipt.items.map((item, index) => (
          <Animated.View key={item.id} entering={enter(3 + Math.min(index, 6))}>
            <DishCard
              item={item}
              readOnly={readOnly}
              pending={pendingIds.includes(item.id)}
              completed={completedIds.includes(item.id)}
              onRate={(rating) =>
                rating === undefined ? onRate(item) : onRate(item, rating)
              }
              {...(onEdit ? { onEdit: () => onEdit(item) } : {})}
            />
          </Animated.View>
        ))}
      </View>

      <View style={styles.total}>
        <Text style={styles.statusTitle}>{t('receipt.total')}</Text>
        <Text style={styles.totalValue}>{formatMoney(receipt.totalMinor)}</Text>
      </View>

      {allRated && (
        <Animated.View
          entering={FadeIn.duration(300).reduceMotion(ReduceMotion.System)}
          style={styles.complete}
          accessibilityLiveRegion="polite"
        >
          <Icon icon={PartyPopper} color={o.colors.rated} decorative />
          <View style={styles.copy}>
            <Text style={styles.statusTitle}>{t('receipt.doneTitle')}</Text>
            <Text style={styles.sub}>{t('receipt.doneBody')}</Text>
          </View>
        </Animated.View>
      )}
      {!remaining && <Button label={t('feedback.home')} onPress={onHome} />}

      {fiscal && (
        <View style={styles.details}>
          <PressSurface
            accessibilityRole="button"
            accessibilityLabel={t('notEligible.details')}
            accessibilityState={{ expanded: details }}
            onPress={() => setDetails((value) => !value)}
            contentStyle={styles.toggle}
          >
            <Text style={styles.section}>{t('notEligible.details')}</Text>
            <Icon
              icon={details ? ChevronUp : ChevronDown}
              size="small"
              color={o.colors.secondary}
              decorative
            />
          </PressSurface>
          {details && (
            <Animated.View
              entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
              style={styles.detailsBody}
            >
              <FiscalSummary fiscal={fiscal} compact />
              <FiscalFooter fiscal={fiscal} />
            </Animated.View>
          )}
        </View>
      )}
      {!fiscal && <MockDataNotice />}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  list: {
    gap: spacing[16],
    paddingBottom: spacing[24],
    paddingRight: Platform.OS === 'web' ? spacing[12] : 0,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  sub: { ...o.type.caption, color: o.colors.secondary },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
    borderTopWidth: 1,
    borderTopColor: o.colors.border,
  },
  totalValue: { ...o.type.title, color: o.colors.ink },
  status: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: o.radius.dish,
    backgroundColor: o.colors.soft,
    borderWidth: 1,
    borderColor: o.colors.border,
  },
  statusPartner: {
    backgroundColor: o.colors.primaryTint,
    borderColor: o.colors.primaryTint,
  },
  statusEarned: {
    backgroundColor: o.colors.ratedTint,
    borderColor: o.colors.ratedTint,
  },
  statusTitle: { ...o.type.product, color: o.colors.ink },
  sectionHead: { gap: spacing[8], marginTop: spacing[4] },
  section: { ...o.type.product, fontSize: 16, color: o.colors.ink },
  progress: { gap: 6 },
  progressText: { ...o.type.caption, color: o.colors.secondary },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: o.colors.emptyStar,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3, backgroundColor: o.colors.rated },
  dishes: { gap: spacing[12] },
  complete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: o.radius.dish,
    backgroundColor: o.colors.ratedTint,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: o.colors.border,
    paddingTop: spacing[4],
  },
  toggle: {
    minHeight: o.size.target,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsBody: { gap: spacing[12] },
});
