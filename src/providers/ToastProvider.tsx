import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/feedback/Toast';
import { spacing } from '@/design';

const ToastContext = createContext<(message: string) => void>(() => {
  throw new Error('Toast provider is missing');
});
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <ToastContext.Provider value={setMessage}>
      <View style={styles.fill}>
        {children}
        {message !== null && (
          <View
            pointerEvents="box-none"
            style={[styles.host, { bottom: insets.bottom + spacing[20] }]}
          >
            <Toast
              visible
              message={message}
              dismissLabel={t('navigation.close')}
              onDismiss={() => setMessage(null)}
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
