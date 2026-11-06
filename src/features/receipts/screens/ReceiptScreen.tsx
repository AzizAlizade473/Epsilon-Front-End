import { useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { layout } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { useReceipt } from '@/hooks/useReceipt';
import { useFeedback } from '@/providers/FeedbackProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatMoney } from '@/lib/money';
import {
  selectReceiptRating,
  clearReceiptRating,
} from '@/lib/receipt-rating-selection';
import { ReceiptContent } from '../components/ReceiptContent';
export function ReceiptScreen() {
  const params = useLocalSearchParams<{ receiptId?: string }>();
  const id = typeof params.receiptId === 'string' ? params.receiptId : '';
  const query = useReceipt(id),
    router = useRouter(),
    feedback = useFeedback(),
    toast = useToast();
  const { t } = useTranslation();
  const window = useWindowDimensions();
  const completion = feedback.completion,
    clear = feedback.clearCompletion;
  useFocusEffect(
    useCallback(() => {
      if (completion?.entry.receiptId !== id) return;
      const reward = completion.result.reward;
      toast(
        reward.status === 'confirmed' && reward.amountMinor !== null
          ? t('feedback.rewardConfirmed') +
              ' ' +
              formatMoney(reward.amountMinor, { sign: 'always' })
          : t(
              reward.status === 'pending'
                ? 'feedback.rewardPending'
                : 'feedback.sent',
            ),
      );
      clear();
    }, [completion, id, toast, t, clear]),
  );
  const close = () =>
    router.canGoBack() ? router.back() : router.replace('/home');
  return (
    <Sheet
      appearance="receipt"
      onClose={close}
      accessibilityLabel={t('navigation.receipt')}
    >
      <View
        style={[styles.body, { height: window.height * o.receiptHeightRatio }]}
      >
        {query.data ? (
          <ReceiptContent
            receipt={query.data}
            pendingIds={feedback.entries.map((entry) => entry.receiptItemId)}
            completedIds={feedback.completedIds}
            onClose={close}
            onRate={(item, rating) => {
              clearReceiptRating();
              if (rating !== undefined) selectReceiptRating(item.id, rating);
              router.push({
                pathname: '/rate/[receiptItemId]',
                params: { receiptItemId: item.id, receiptId: id },
              });
            }}
            onHome={() => {
              router.dismissAll();
              router.replace('/home');
            }}
          />
        ) : query.isLoading ? (
          <Skeleton
            width="100%"
            height={layout.controlHeight}
            accessibilityLabel={t('common.loading')}
          />
        ) : (
          <ErrorState
            title={t('receipt.unavailable')}
            retryLabel={t('common.retry')}
            loading={query.isFetching}
            onRetry={() => {
              void query.refetch();
            }}
          />
        )}
      </View>
    </Sheet>
  );
}
const styles = StyleSheet.create({ body: { flexShrink: 1 } });
