import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  bootStorage,
  storageKeys,
  type AuthState,
  type BootData,
} from '@/lib/bootstrap';
import type { AuthResult, Session } from '@/services/contracts';
import { services } from '@/services';
import { setAccessToken } from '@/services/http/client';
import {
  configureAuthRefresh,
  resetAuthRefresh,
} from '@/services/http/client-with-refresh';

type AuthActions = { completeSignIn: (result: AuthResult) => Promise<void> };
const StateContext = createContext<AuthState | null>(null);
const ActionsContext = createContext<AuthActions | null>(null);

export function useAuth() {
  const value = useContext(StateContext);
  if (!value) throw new Error('Auth provider is missing');
  return value;
}
export function useAuthActions() {
  const value = useContext(ActionsContext);
  if (!value) throw new Error('Auth provider is missing');
  return value;
}

export function AuthProvider({
  boot,
  children,
}: {
  boot: BootData;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    ...boot,
    user: null,
    requirePhoneVerification: true,
  });
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restored, setRestored] = useState(!boot.session);
  const session = useRef(boot.session);
  const saveSession = useCallback(async (next: Session) => {
    await SecureStore.setItemAsync(storageKeys.session, JSON.stringify(next));
    bootStorage.clear();
    session.current = next;
    setAccessToken(next.accessToken);
    setState((previous) => ({ ...previous, session: next }));
  }, []);

  useEffect(() => {
    setAccessToken(session.current?.accessToken ?? null);
    configureAuthRefresh({
      refresh: async () => {
        if (!session.current) throw new Error('Session unavailable');
        const next = await services.auth.refresh({
          refreshToken: session.current.refreshToken,
        });
        await saveSession(next);
        return next.accessToken;
      },
      onLogout: async () => {
        session.current = null;
        setAccessToken(null);
        bootStorage.clear();
        queryClient.clear();
        setState((previous) => ({
          ...previous,
          session: null,
          user: null,
          restoreStatus: undefined,
        }));
        setRestored(true);
        await SecureStore.deleteItemAsync(storageKeys.session);
      },
    });
    return () => {
      resetAuthRefresh();
      setAccessToken(null);
    };
  }, [queryClient, saveSession]);

  useEffect(() => {
    if (!boot.session) return;
    let active = true;
    const restore = async () => {
      try {
        const [user, config] = await Promise.all([
          services.user.me(),
          services.config.get(),
        ]);
        if (active && session.current) {
          setState((previous) => ({
            ...previous,
            user,
            requirePhoneVerification: config.requirePhoneVerification,
            restoreStatus: undefined,
          }));
          setRestored(true);
        }
      } catch {
        if (active && session.current)
          setState((previous) => ({ ...previous, restoreStatus: 'error' }));
      }
    };
    // Defer service hydration until after the minimal boot render.
    const timer = setTimeout(() => {
      void restore();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [boot.session, restoreAttempt]);

  const completeSignIn = async (result: AuthResult) => {
    // Commit the secure record before publishing authenticated state or navigating.
    await SecureStore.setItemAsync(storageKeys.onboarding, 'true');
    await saveSession(result.session);
    queryClient.clear();
    setState((previous) => ({
      ...previous,
      user: result.user,
      onboardingComplete: true,
    }));
  };

  return (
    <StateContext.Provider
      value={{
        ...state,
        restoreStatus: restored
          ? undefined
          : (state.restoreStatus ?? 'loading'),
        retryRestore: () => {
          setState((previous) => ({ ...previous, restoreStatus: 'loading' }));
          setRestoreAttempt((attempt) => attempt + 1);
        },
      }}
    >
      <ActionsContext.Provider value={{ completeSignIn }}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}
