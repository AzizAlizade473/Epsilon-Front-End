import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { useReceipt } from '@/hooks/useReceipt';
import { useFeedback } from '@/providers/FeedbackProvider';
import { FeedbackConfirmation } from '../components/FeedbackConfirmation';

export function FeedbackDoneScreen() {
  const [exiting, setExiting] = useState(false);
  const navigationLocked = useRef(false);
  const { completion, clearCompletion, completedIds, entries } = useFeedback();
  const router = useRouter();
  const receiptId = completion?.entry.receiptId ?? '';
  const query = useReceipt(receiptId);
  const home = useCallback(() => {
    if (navigationLocked.current) return;
    navigationLocked.current = true;
    setExiting(true);
    router.dismissAll();
    router.replace('/home');
    clearCompletion();
  }, [router, clearCompletion]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        home();
        return true;
      },
    );
    return () => subscription.remove();
  }, [home]);
  if (exiting) return null;
  if (!completion) return <Redirect href="/home" />;
  const remaining =
    query.data?.status === 'verified' &&
    query.data.items.some(
      (item) =>
        item.canRate &&
        item.rating === null &&
        item.id !== completion.entry.receiptItemId &&
        !completedIds.includes(item.id) &&
        !entries.some((entry) => entry.receiptItemId === item.id),
    );
  return (
    <Screen surface="surface">
      <FeedbackConfirmation
        result={completion.result}
        itemName={completion.itemName}
        remaining={Boolean(remaining)}
        onHome={home}
        onReceipt={() => {
          if (navigationLocked.current) return;
          navigationLocked.current = true;
          setExiting(true);
          router.dismissTo({
            pathname: '/receipt/[receiptId]',
            params: { receiptId },
          });
          clearCompletion();
        }}
      />
    </Screen>
  );
}
