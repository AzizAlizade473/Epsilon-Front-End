import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { createQueryClient } from '@/services/query';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { ToastProvider } from './ToastProvider';
import { FeedbackProvider } from './FeedbackProvider';
import { CrashRuntime } from './CrashRuntime';
import { AuthProvider, useAuth as useAuthState } from './AuthProvider';

import { colors } from '@/design';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { UpdateGate } from '@/components/feedback/UpdateGate';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import type { BootData } from '@/lib/bootstrap';
import { i18n, onLanguageChange } from '@/lib/i18n';
import { setLocaleAccessor } from '@/services/http/client';

export type { AuthState, NavigationUser } from '@/lib/bootstrap';
export function useAuth() {
  return useAuthState();
}

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
  },
};

export function RuntimeProviders({
  boot,
  children,
  onBootConsumed,
}: {
  boot: BootData;
  children: ReactNode;
  onBootConsumed?: () => void;
}) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
      if (state === 'active')
        void queryClient.refetchQueries(
          { type: 'active' },
          { cancelRefetch: false },
        );
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, [queryClient]);

  useEffect(() => {
    setLocaleAccessor(() => i18n.language ?? 'az');
    return onLanguageChange((lang) => {
      setLocaleAccessor(() => lang);
    });
  }, []);

  return (
    <ThemeProvider value={lightTheme}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider boot={boot} onBootConsumed={onBootConsumed}>
            <ToastProvider>
              <CrashRuntime />
              <OfflineBanner>
                <UpdateGate>
                  <FeedbackProvider>
                    <AppErrorBoundary>{children}</AppErrorBoundary>
                  </FeedbackProvider>
                </UpdateGate>
              </OfflineBanner>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}
