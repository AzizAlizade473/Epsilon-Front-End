import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/feedback/Skeleton';
import { layout } from '@/design';
import { BackButton } from '@/components/navigation/BackButton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { useReceipt } from '@/hooks/useReceipt';
import { useFeedback } from '@/providers/FeedbackProvider';
import { ReceiptContent } from '../components/ReceiptContent';

export function ReceiptScreen() {
  const params = useLocalSearchParams<{ receiptId?: string }>();
  const id = typeof params.receiptId === 'string' ? params.receiptId : '';
  const query = useReceipt(id);
  const router = useRouter();
  const { t } = useTranslation();
  const feedback = useFeedback();
  return (
    <Screen
      scroll={false}
      title={t('navigation.receipt')}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
        />
      }
    >
      {query.data ? (
        <ReceiptContent
          receipt={query.data}
          pendingIds={feedback.entries.map((entry) => entry.receiptItemId)}
          completedIds={feedback.completedIds}
          onRate={(item) =>
            router.push({
              pathname: '/rate/[receiptItemId]',
              params: { receiptItemId: item.id, receiptId: id },
            })
          }
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
          onRetry={() => {
            void query.refetch();
          }}
          loading={query.isFetching}
        />
      )}
    </Screen>
  );
}
