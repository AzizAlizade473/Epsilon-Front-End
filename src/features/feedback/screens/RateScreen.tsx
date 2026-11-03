import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { safeIdSchema } from '@/lib/deep-link';
import { useReceipt } from '@/hooks/useReceipt';
import { useFeedback } from '@/providers/FeedbackProvider';
import type { Receipt } from '@/services/contracts';
import { queryKeys } from '@/services/query';
import { generateIdempotencyKey } from '@/services/http/idempotency';
import { trustedServerTime } from '@/lib/server-clock';
import { OutboxFullError } from '@/services/feedback-outbox';
import { RatingForm, type RatingDraft } from '../components/RatingForm';

export function RateScreen() {
  const params = useLocalSearchParams<{
    receiptItemId?: string;
    receiptId?: string;
  }>();
  const itemId =
    typeof params.receiptItemId === 'string' &&
    safeIdSchema.safeParse(params.receiptItemId).success
      ? params.receiptItemId
      : '';
  const client = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  const feedback = useFeedback();
  const cached = client
    .getQueriesData<Receipt>({ queryKey: queryKeys.receipt.all })
    .flatMap(([, data]) => {
      return data?.items.some((item) => item.id === itemId) ? [data] : [];
    })[0];
  const receiptId =
    typeof params.receiptId === 'string'
      ? params.receiptId
      : (cached?.id ?? '');
  const query = useReceipt(receiptId);
  const receipt = query.data;
  const item = receipt?.items.find((entry) => entry.id === itemId);
  const saved = feedback.entries.find(
    (entry) => entry.receiptItemId === itemId,
  );
  const [draft, setDraft] = useState<RatingDraft>(() => ({
    rating: saved?.rating ?? 0,
    comment: saved?.comment ?? '',
    reasonCodes: saved?.reasonCodes ?? [],
  }));
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [error, setError] = useState<string>();
  const [key, setKey] = useState(() =>
    generateIdempotencyKey('feedback-submit'),
  );
  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [router]);
  const dirty =
    draft.rating > 0 ||
    draft.comment.length > 0 ||
    draft.reasonCodes.length > 0;
  const beforeClose = useCallback(() => {
    if (lock.current) return false;
    if (!dirty || saved) return true;
    Alert.alert(t('feedback.discardTitle'), t('feedback.discardBody'), [
      { text: t('feedback.stay'), style: 'cancel' },
      { text: t('feedback.leave'), style: 'destructive', onPress: close },
    ]);
    return false;
  }, [dirty, saved, t, close]);
  const eligible =
    receipt?.status === 'verified' &&
    item?.canRate &&
    item.rating === null &&
    !feedback.completedIds.includes(itemId);
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
    try {
      const outcome = await feedback.submit(
        saved ?? {
          receiptId: receipt.id,
          receiptItemId: item.id,
          rating: draft.rating,
          comment: draft.comment,
          reasonCodes: draft.reasonCodes,
          idempotencyKey: key,
          createdAt: (() => {
            const now = trustedServerTime();
            return now === null ? null : Math.floor(now);
          })(),
        },
        item.name,
      );
      if (!mounted.current) return;
      if (outcome === 'sent') router.replace('/feedback-done');
      else if (outcome === 'duplicate') close();
      else if (outcome === 'invalid') {
        setError(t('feedback.invalid'));
        setKey(generateIdempotencyKey('feedback-submit'));
      } else setError(t('feedback.retryLater'));
    } catch (error) {
      if (!mounted.current) return;
      setError(
        t(
          error instanceof OutboxFullError
            ? 'feedback.queueFull'
            : 'feedback.saveFailed',
        ),
      );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <Sheet
      onClose={close}
      onBeforeClose={beforeClose}
      accessibilityLabel={t('navigation.rate')}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        {query.isLoading ? (
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        ) : eligible && item && receipt ? (
          <RatingForm
            position={
              receipt.items.findIndex((entry) => entry.id === item.id) + 1
            }
            total={receipt.items.length}
            progressTotal={
              receipt.items.filter(
                (entry) =>
                  entry.canRate ||
                  entry.rating !== null ||
                  feedback.completedIds.includes(entry.id),
              ).length
            }
            ratedCount={
              receipt.items.filter(
                (entry) =>
                  entry.rating !== null ||
                  feedback.completedIds.includes(entry.id),
              ).length
            }
            itemName={item.name}
            restaurantName={receipt.restaurant.name}
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
            disabled={busy || Boolean(saved)}
            busy={busy}
            error={error}
            queued={Boolean(saved)}
          />
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
