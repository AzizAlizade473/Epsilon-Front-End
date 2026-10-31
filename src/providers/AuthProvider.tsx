import * as SecureStore from 'expo-secure-store';
import '@/lib/preferences';
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
  resolveBootstrapRoute,
  storageKeys,
  type AuthState,
  type BootData,
} from '@/lib/bootstrap';
import { authOperation, clearAuthFlows } from '@/lib/auth-lifecycle';
import { initializeGoogle } from '@/lib/google-signin';
import type {
  AuthResult,
  Config,
  NextStep,
  Session,
  User,
} from '@/services/contracts';
import { services } from '@/services';
import { queryKeys } from '@/services/query';
import { setAccessToken } from '@/services/http/client';
import {
  configureAuthRefresh,
  resetAuthRefresh,
} from '@/services/http/client-with-refresh';

type AuthActions = {
  reauthenticate: (result: AuthResult) => Promise<void>;
  finishAccountDeletion: () => Promise<void>;
  completeSignIn: (result: AuthResult) => Promise<void>;
  updateUser: (
    user: User,
    nextStep?: NextStep | null,
  ) => ReturnType<typeof resolveBootstrapRoute>;
  loadConfig: () => Promise<Config>;
  logout: () => Promise<void>;
  skipPhone: () => void;
};
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
  onBootConsumed,
}: {
  boot: BootData;
  children: ReactNode;
  onBootConsumed?: () => void;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    ...boot,
    user: null,
    requirePhoneVerification: true,
  });
  const snapshot = useRef(state);
  const [hasBootSession] = useState(Boolean(boot.session));
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restored, setRestored] = useState(!boot.session);
  const session = useRef(boot.session);
  const queue = useRef(Promise.resolve());
  const publish = useCallback((patch: Partial<AuthState>) => {
    snapshot.current = { ...snapshot.current, ...patch };
    setState(snapshot.current);
  }, []);
  const persist = useCallback((operation: () => Promise<void>) => {
    const pending = queue.current.catch(() => undefined).then(operation);
    queue.current = pending;
    return pending;
  }, []);
  const saveSession = useCallback(
    async (next: Session, epoch = authOperation.epoch()) => {
      await persist(async () => {
        if (!authOperation.current(epoch))
          throw new Error('Obsolete authentication');
        await SecureStore.setItemAsync(
          storageKeys.session,
          JSON.stringify(next),
        );
      });
      if (!authOperation.current(epoch))
        throw new Error('Obsolete authentication');
      bootStorage.clear();
      session.current = next;
      setAccessToken(next.accessToken);
      publish({ session: next });
    },
    [persist, publish],
  );
  const clearSession = useCallback(async () => {
    session.current = null;
    setAccessToken(null);
    bootStorage.clear();
    queryClient.clear();
    publish({
      session: null,
      user: null,
      onboardingComplete: false,
      nextStep: undefined,
      restoreStatus: undefined,
    });
    setRestored(true);
    const cleanup = clearAuthFlows();
    await persist(async () => {
      await Promise.all(
        Object.values(storageKeys).map((key) =>
          SecureStore.deleteItemAsync(key),
        ),
      );
    });
    await cleanup;
  }, [persist, publish, queryClient]);
  const loadConfig = useCallback(async () => {
    const epoch = authOperation.epoch();
    const config = await services.config.get();
    if (authOperation.current(epoch))
      publish({
        requirePhoneVerification: config.requirePhoneVerification,
        minimumAge: config.minAge,
      });
    return config;
  }, [publish]);
  const updateUser = useCallback(
    (user: User, nextStep?: NextStep | null) => {
      publish({ user, nextStep: nextStep ?? undefined });
      queryClient.setQueryData(queryKeys.user.profile(), user);
      return resolveBootstrapRoute(snapshot.current);
    },
    [publish, queryClient],
  );
  useEffect(() => {
    onBootConsumed?.();
    bootStorage.clear();
  }, [onBootConsumed]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void initializeGoogle().catch(() => undefined);
    });
    setAccessToken(session.current?.accessToken ?? null);
    configureAuthRefresh({
      refresh: async () => {
        const epoch = authOperation.epoch();
        if (!session.current) throw new Error('Session unavailable');
        const next = await services.auth.refresh({
          refreshToken: session.current.refreshToken,
        });
        if (!authOperation.current(epoch))
          throw new Error('Obsolete authentication');
        await saveSession(next, epoch);
        return next.accessToken;
      },
      onLogout: clearSession,
    });
    return () => {
      cancelAnimationFrame(frame);
      resetAuthRefresh();
      setAccessToken(null);
      queryClient.clear();
    };
  }, [saveSession, clearSession, queryClient]);
  useEffect(() => {
    if (!hasBootSession) return;
    let active = true;
    const epoch = authOperation.epoch();
    const timer = setTimeout(() => {
      void Promise.all([services.user.me(), loadConfig()])
        .then(([user]) => {
          if (active && authOperation.current(epoch) && session.current) {
            updateUser(user);
            publish({ restoreStatus: undefined });
            setRestored(true);
          }
        })
        .catch(() => {
          if (active && authOperation.current(epoch) && session.current)
            publish({ restoreStatus: 'error' });
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [hasBootSession, restoreAttempt, loadConfig, updateUser, publish]);
  const completeSignIn = async (result: AuthResult) => {
    const epoch = authOperation.epoch();
    await persist(() =>
      SecureStore.setItemAsync(storageKeys.onboarding, 'true'),
    );
    await saveSession(result.session, epoch);
    queryClient.clear();
    publish({ onboardingComplete: true });
    updateUser(result.user, result.nextStep);
    setRestored(true);
  };
  const logout = async () => {
    try {
      await services.auth.logout();
    } finally {
      await clearSession();
    }
  };
  return (
    <StateContext.Provider
      value={{
        ...state,
        restoreStatus: restored
          ? undefined
          : (state.restoreStatus ?? 'loading'),
        retryRestore: () => {
          publish({ restoreStatus: 'loading' });
          setRestoreAttempt((attempt) => attempt + 1);
        },
      }}
    >
      <ActionsContext.Provider
        value={{
          completeSignIn,
          reauthenticate: async (result) => {
            if (
              result.user.id !== snapshot.current.user?.id ||
              result.isNewUser
            )
              throw new Error('Account mismatch');
            await saveSession(result.session);
          },
          finishAccountDeletion: async () => {
            await clearSession();
          },
          updateUser,
          loadConfig,
          logout,
          skipPhone: () => {
            if (session.current && !snapshot.current.requirePhoneVerification)
              publish({ nextStep: 'home' });
          },
        }}
      >
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}
