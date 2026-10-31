import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { ToastProvider } from './ToastProvider';

import { colors } from '@/design';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import type { BootData } from '@/lib/bootstrap';
import { i18n } from '@/lib/i18n';

export type NavigationUser = {
  firstName: string | null;
  birthDate: string | null;
  phoneVerified: boolean;
};
export type AuthState = BootData & {
  user: NavigationUser | null;
  requirePhoneVerification: boolean;
};
const AuthContext = createContext<AuthState | null>(null);
export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Auth provider is missing');
  return auth;
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
}: {
  boot: BootData;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <ThemeProvider value={lightTheme}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider
            value={{ ...boot, user: null, requirePhoneVerification: true }}
          >
            <ToastProvider>
              <OfflineBanner>{children}</OfflineBanner>
            </ToastProvider>
          </AuthContext.Provider>
        </QueryClientProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}
