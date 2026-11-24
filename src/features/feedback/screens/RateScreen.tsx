import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ReduceMotion,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { OriginalStars } from '@/components/receipts/OriginalStars';
import { colors, spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { displayMerchantName } from '@/lib/brands';
import { dishName } from '@/lib/dish-name';
import { formatDate } from '@/lib/date';
import { safeIdSchema } from '@/lib/deep-link';
import { useReceipt } from '@/hooks/useReceipt';
import { useFeedback } from '@/providers/FeedbackProvider';
import type { Receipt, ReceiptItem } from '@/services/contracts';
import { queryKeys } from '@/services/query';
import { generateIdempotencyKey } from '@/services/http/idempotency';
import { trustedServerTime } from '@/lib/server-clock';
import { OutboxFullError } from '@/services/feedback-outbox';
import {
  selectedReceiptRating,
  clearReceiptRating,
} from '@/lib/receipt-rating-selection';
import { RatingForm, type RatingDraft } from '../components/RatingForm';

/** How long the "saved" acknowledgement stays before the next dish comes in. */
const THANKS_MS = 1300;
const emptyDraft = (rating = 0): RatingDraft => ({
  rating,
  comment: '',
  reasonCodes: [],
});

/** Meal progress: advances only when a rating is actually saved or skipped. */
function MealProgress({ done, total }: { done: number; total: number }) {
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
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

/**
 * One meal, one dish at a time: the restaurant and the dish are in focus, a
 * rating is saved by the real backend, acknowledged, and the next dish comes in
 * without leaving the sheet. Dishes the customer did not try can be skipped.
 */
export function RateScreen() {
  const params = useLocalSearchParams<{
    receiptItemId?: string;
    receiptId?: string;
  }>();
  const startId =
    typeof params.receiptItemId === 'string' &&
    safeIdSchema.safeParse(params.receiptItemId).success
      ? params.receiptItemId
      : '';
  const client = useQueryClient();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const feedback = useFeedback();
  const cached = client
    .getQueriesData<Receipt>({ queryKey: queryKeys.receipt.all })
    // Only receipt details: ['receipt', 'list'] holds an array of ids, not a receipt.
    .flatMap(([key, data]) =>
      key[1] === 'detail' && data?.items.some((item) => item.id === startId)
        ? [data]
        : [],
    )[0];
  const receiptId =
    typeof params.receiptId === 'string'
      ? params.receiptId
      : (cached?.id ?? '');
  const query = useReceipt(receiptId);
  const receipt = query.data;

  const [current, setCurrent] = useState(startId);
  const [phase, setPhase] = useState<'rate' | 'thanks' | 'done'>('rate');
  const [thanks, setThanks] = useState<'sent' | 'queued'>('sent');
  const [handled, setHandled] = useState<
    { id: string; name: string; rating: number | null }[]
  >([]);
  const item = receipt?.items.find((entry) => entry.id === current);
  const saved = feedback.entries.find(
    (entry) => entry.receiptItemId === current,
  );
  const [draft, setDraft] = useState<RatingDraft>(() =>
    saved
      ? {
          rating: saved.rating,
          comment: saved.comment ?? '',
          reasonCodes: saved.reasonCodes ?? [],
        }
      : emptyDraft(selectedReceiptRating(startId)),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const mounted = useRef(true);
  const key = useRef(generateIdempotencyKey('feedback-submit'));
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearReceiptRating();
    };
  }, []);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [router]);
  const toReceipt = useCallback(() => {
    if (!receipt) return close();
    router.dismissTo({
      pathname: '/receipt/[receiptId]',
      params: { receiptId: receipt.id },
    });
  }, [receipt, router, close]);

  const isRated = (entry: ReceiptItem) =>
    entry.rating !== null ||
    feedback.completedIds.includes(entry.id) ||
    handled.some((done) => done.id === entry.id && done.rating !== null);
  const verified = receipt?.status === 'verified';
  const rateable = (receipt?.items ?? []).filter(
    (entry) => isRated(entry) || (verified && entry.canRate),
  );
  const open = (entry: ReceiptItem) =>
    verified &&
    entry.canRate &&
    !isRated(entry) &&
    !handled.some((done) => done.id === entry.id);
  const eligible = Boolean(item && open(item));
  const position = rateable.findIndex((entry) => entry.id === current) + 1;
  const done = rateable.filter(
    (entry) => isRated(entry) || handled.some((h) => h.id === entry.id),
  ).length;

  const dirty =
    phase === 'rate' &&
    (draft.rating > 0 ||
      draft.comment.length > 0 ||
      draft.reasonCodes.length > 0);
  const beforeClose = useCallback(() => {
    if (lock.current) return false;
    if (!dirty || saved) return true;
    Alert.alert(t('feedback.discardTitle'), t('feedback.discardBody'), [
      { text: t('feedback.stay'), style: 'cancel' },
      { text: t('feedback.leave'), style: 'destructive', onPress: close },
    ]);
    return false;
  }, [dirty, saved, t, close]);

  /** The next dish still waiting for an opinion, after recording `entry` as handled. */
  const advance = (entry: {
    id: string;
    name: string;
    rating: number | null;
  }) => {
    const nextHandled = [...handled.filter((h) => h.id !== entry.id), entry];
    setHandled(nextHandled);
    const next = receipt?.items.find(
      (candidate) =>
        candidate.id !== entry.id &&
        open(candidate) &&
        !nextHandled.some((h) => h.id === candidate.id),
    );
    setDraft(emptyDraft());
    setError(undefined);
    key.current = generateIdempotencyKey('feedback-submit');
    if (next) setCurrent(next.id);
    return next;
  };

  // After the acknowledgement, bring in the next dish (or the meal summary).
  const pendingNext = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pendingNext.current), []);
  const acknowledge = (
    kind: 'sent' | 'queued',
    entry: { id: string; name: string; rating: number },
  ) => {
    setThanks(kind);
    setPhase('thanks');
    pendingNext.current = setTimeout(() => {
      if (!mounted.current) return;
      setPhase(advance(entry) ? 'rate' : 'done');
    }, THANKS_MS);
  };

  const submit = async () => {
    if (
      lock.current ||
      !eligible ||
      !item ||
      !receipt ||
      (saved?.rating ?? draft.rating) < 1
    )
      return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    const rating = saved?.rating ?? draft.rating;
    try {
      const outcome = await feedback.submit(
        saved ?? {
          receiptId: receipt.id,
          receiptItemId: item.id,
          rating: draft.rating,
          comment: draft.comment,
          reasonCodes: draft.reasonCodes,
          idempotencyKey: key.current,
          createdAt: (() => {
            const now = trustedServerTime();
            return now === null ? null : Math.floor(now);
          })(),
        },
        item.name,
      );
      if (!mounted.current) return;
      const entry = { id: item.id, name: dishName(item.name), rating };
      if (outcome === 'sent' || outcome === 'duplicate')
        acknowledge('sent', entry);
      else if (outcome === 'queued') acknowledge('queued', entry);
      else {
        // Keep the stars and words; a fresh key lets the corrected rating through.
        setError(t('feedback.invalid'));
        key.current = generateIdempotencyKey('feedback-submit');
      }
    } catch (cause) {
      if (!mounted.current) return;
      setError(
        t(
          cause instanceof OutboxFullError
            ? 'feedback.queueFull'
            : 'feedback.saveFailed',
        ),
      );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const merchant = receipt
    ? (receipt.fiscal?.merchant.objectName ?? receipt.restaurant.name)
    : '';
  const ratedThisVisit = handled.filter((h) => h.rating !== null);

  return (
    <Sheet
      appearance="feedback"
      onClose={close}
      onBeforeClose={beforeClose}
      accessibilityLabel={t('navigation.rate')}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        {query.isLoading ? (
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        ) : receipt && (eligible || phase !== 'rate') ? (
          <View style={styles.body}>
            <Animated.View
              entering={FadeIn.duration(240).reduceMotion(ReduceMotion.System)}
              style={styles.meal}
            >
              <BrandBadge
                name={merchant}
                logoUrl={receipt.restaurant.logoUrl}
                size={44}
              />
              <View style={styles.mealCopy}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {displayMerchantName(merchant)}
                </Text>
                <Text style={styles.sub}>
                  {t('rate.yourMeal', {
                    date: formatDate(receipt.issuedAt, {
                      locale: i18n.language,
                    }),
                  })}
                </Text>
              </View>
              {phase !== 'done' && position > 0 && (
                <Text style={styles.position}>
                  {t('rate.position', { n: position, total: rateable.length })}
                </Text>
              )}
            </Animated.View>
            <MealProgress done={done} total={rateable.length} />

            {phase === 'rate' && item ? (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(260).reduceMotion(
                  ReduceMotion.System,
                )}
              >
                <RatingForm
                  itemName={dishName(item.name)}
                  draft={
                    saved
                      ? {
                          rating: saved.rating,
                          comment: saved.comment ?? '',
                          reasonCodes: saved.reasonCodes ?? [],
                        }
                      : draft
                  }
                  onChange={(next) => {
                    if (next.reasonCodes.length <= 3) setDraft(next);
                  }}
                  onSubmit={() => {
                    void submit();
                  }}
                  onSkip={() => {
                    if (lock.current) return;
                    if (
                      !advance({
                        id: item.id,
                        name: dishName(item.name),
                        rating: null,
                      })
                    )
                      setPhase('done');
                  }}
                  disabled={busy || Boolean(saved)}
                  busy={busy}
                  error={error}
                  queued={Boolean(saved)}
                />
              </Animated.View>
            ) : phase === 'thanks' ? (
              <View style={styles.thanks} accessibilityLiveRegion="polite">
                <Animated.View
                  entering={ZoomIn.duration(260).reduceMotion(
                    ReduceMotion.System,
                  )}
                  style={styles.seal}
                >
                  <Icon icon={Check} color={colors.surface} decorative />
                </Animated.View>
                <Text style={styles.thanksTitle} accessibilityRole="header">
                  {t('rate.thanks')}
                </Text>
                <Text style={styles.sub}>
                  {t(
                    thanks === 'queued'
                      ? 'rate.thanksQueued'
                      : 'rate.thanksSaved',
                  )}
                </Text>
              </View>
            ) : (
              <Animated.View
                entering={FadeInDown.duration(260).reduceMotion(
                  ReduceMotion.System,
                )}
                style={styles.done}
              >
                <Text style={styles.thanksTitle} accessibilityRole="header">
                  {t(
                    ratedThisVisit.length
                      ? 'rate.doneTitle'
                      : 'rate.doneSkipped',
                  )}
                </Text>
                {ratedThisVisit.length > 0 && (
                  <Text style={styles.sub}>
                    {t('rate.doneBody', {
                      count: ratedThisVisit.length,
                      place: displayMerchantName(merchant),
                    })}
                  </Text>
                )}
                <View style={styles.summary}>
                  {ratedThisVisit.map((entry) => (
                    <View key={entry.id} style={styles.summaryRow}>
                      <Text style={styles.summaryName}>{entry.name}</Text>
                      <OriginalStars value={entry.rating ?? 0} disabled />
                    </View>
                  ))}
                </View>
                <Button label={t('rate.viewMeal')} onPress={toReceipt} />
                <Button
                  variant="ghost"
                  label={t('feedback.home')}
                  onPress={() => {
                    router.dismissAll();
                    router.replace('/home');
                  }}
                />
              </Animated.View>
            )}
          </View>
        ) : (
          <>
            <Text>{t('feedback.unavailable')}</Text>
            <Button label={t('navigation.close')} onPress={close} />
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[16] },
  meal: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  mealCopy: { flex: 1, minWidth: 0, gap: 2 },
  mealName: { ...o.type.product, fontSize: 16, color: o.colors.ink },
  sub: { ...o.type.caption, color: o.colors.secondary, textAlign: 'center' },
  position: { ...o.type.caption, fontWeight: '700', color: o.colors.secondary },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: o.colors.emptyStar,
    overflow: 'hidden',
    marginBottom: spacing[8],
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
  },
  thanks: {
    alignItems: 'center',
    gap: spacing[8],
    paddingVertical: spacing[32],
  },
  seal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    marginBottom: spacing[8],
  },
  thanksTitle: {
    ...o.type.title,
    color: o.colors.ink,
    textAlign: 'center',
  },
  done: { gap: spacing[12], paddingTop: spacing[8] },
  summary: { gap: spacing[4], paddingVertical: spacing[8] },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    paddingVertical: spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: o.colors.border,
  },
  summaryName: { ...o.type.product, color: o.colors.ink, flex: 1 },
});
