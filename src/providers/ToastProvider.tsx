import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/feedback/Toast';
import { layout, spacing } from '@/design';
import { registerAuthCleanup } from '@/lib/auth-lifecycle';
import { onSessionExpired } from '@/lib/runtime-notices';

const ToastContext = createContext<(message: string) => void>(() => {
  throw new Error('Toast provider is missing');
});
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<{ id: number; message: string }[]>([]);
  const nextId = useRef(0);
  const show = useCallback((message: string) => {
    const id = ++nextId.current;
    setQueue((items) =>
      items.at(-1)?.message === message || items.length >= 20
        ? items
        : [...items, { id, message }],
    );
  }, []);
  const dismiss = useCallback(() => setQueue((items) => items.slice(1)), []);
  const current = queue[0];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useEffect(() => registerAuthCleanup(() => setQueue([])), []);
  useEffect(
    () => onSessionExpired(() => show(t('resilience.sessionExpired'))),
    [show, t],
  );
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(
      () =>
        setQueue((items) =>
          items[0]?.id === current.id ? items.slice(1) : items,
        ),
      layout.toastDuration,
    );
    return () => clearTimeout(timer);
  }, [current, dismiss]);
  return (
    <ToastContext.Provider value={show}>
      <View style={styles.fill}>
        {children}
        {current && (
          <View
            pointerEvents="box-none"
            style={[styles.host, { bottom: insets.bottom + spacing[20] }]}
          >
            <Toast
              key={current.id}
              visible
              message={current.message}
              dismissLabel={t('navigation.close')}
              onDismiss={dismiss}
            />
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  host: {
    position: 'absolute',
    left: spacing.screenMargin,
    right: spacing.screenMargin,
  },
});
