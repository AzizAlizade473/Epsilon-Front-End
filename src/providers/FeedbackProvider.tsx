import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerAuthCleanup, authOperation } from '@/lib/auth-lifecycle';
import { services, type FeedbackResult } from '@/services';
import {
  clearFeedbackStorage,
  createFeedbackOutbox,
  type OutboxEntry,
} from '@/services/feedback-outbox';
import { queryInvalidations } from '@/services/query';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

type Completion = {
  entry: OutboxEntry;
  result: FeedbackResult;
  itemName: string;
};
type FeedbackState = {
  entries: readonly OutboxEntry[];
  completedIds: readonly string[];
  completion: Completion | null;
  submit: (
    entry: OutboxEntry,
    itemName: string,
  ) => Promise<'sent' | 'duplicate' | 'invalid' | 'queued'>;
  clearCompletion: () => void;
};
const Context = createContext<FeedbackState | null>(null);
const empty: readonly OutboxEntry[] = [];
const emptySnapshot = () => empty;
const emptySubscribe = () => () => undefined;
export function useFeedback() {
  const value = useContext(Context);
  if (!value) throw new Error('Feedback provider is missing');
  return value;
}
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <FeedbackRuntime key={user?.id ?? 'signed-out'} owner={user?.id}>
      {children}
    </FeedbackRuntime>
  );
}
function FeedbackRuntime({
  children,
  owner,
}: {
  children: ReactNode;
  owner?: string;
}) {
  const client = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const [completion, setCompletion] = useState<Completion | null>(null);
  const clearCompletion = useCallback(() => setCompletion(null), []);
  const [completedIds, setCompletedIds] = useState<readonly string[]>([]);
  const engine = useMemo(
    () =>
      owner
        ? createFeedbackOutbox(owner, AsyncStorage, (entry, signal) =>
            services.feedback.submit(
              {
                receiptItemId: entry.receiptItemId,
                rating: entry.rating,
                comment: entry.comment,
                reasonCodes: entry.reasonCodes,
              },
              { signal, idempotencyKey: entry.idempotencyKey },
            ),
          )
        : null,
    [owner],
  );
  const entries = useSyncExternalStore(
    engine?.subscribe ?? emptySubscribe,
    engine?.snapshot ?? emptySnapshot,
  );
  useEffect(
    () =>
      registerAuthCleanup(async () => {
        engine?.stop();
        setCompletion(null);
        setCompletedIds([]);
        await clearFeedbackStorage(AsyncStorage);
      }),
    [engine],
  );
  useEffect(() => {
    if (!engine) return;
    const retry = () => {
      if (onlineManager.isOnline()) void engine.flush().catch(() => undefined);
    };
    const unsubscribe = engine.onOutcome((outcome) => {
      if (outcome.kind === 'invalid') toast(t('feedback.invalid'));
      else {
        setCompletedIds((ids) =>
          ids.includes(outcome.entry.receiptItemId)
            ? ids
            : [...ids, outcome.entry.receiptItemId],
        );
        void queryInvalidations.onFeedbackSubmitted(client);
      }
    });
    void engine
      .start()
      .then(retry)
      .catch(() => undefined);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') retry();
    });
    const reconnect = onlineManager.subscribe((online) => {
      if (online) retry();
    });
    return () => {
      unsubscribe();
      foreground.remove();
      reconnect();
      engine.stop();
    };
  }, [engine, client, toast, t]);
  const submit: FeedbackState['submit'] = async (input, itemName) => {
    if (!engine) throw new Error('Session unavailable');
    const epoch = authOperation.epoch();
    await engine.load();
    const entry =
      engine
        .snapshot()
        .find((saved) => saved.receiptItemId === input.receiptItemId) ?? input;
    await engine.enqueue(entry);
    await engine.flush();
    if (!authOperation.current(epoch)) throw new Error('Session unavailable');
    const outcome = engine.outcome(entry.idempotencyKey);
    if (outcome?.kind === 'sent') {
      setCompletion({ entry, itemName, result: outcome.result });
      return 'sent';
    }
    if (outcome?.kind === 'duplicate') {
      toast(t('feedback.duplicate'));
      return 'duplicate';
    }
    return outcome?.kind ?? 'queued';
  };
  return (
    <Context.Provider
      value={{
        entries,
        completedIds,
        completion,
        submit,
        clearCompletion,
      }}
    >
      {children}
    </Context.Provider>
  );
}
