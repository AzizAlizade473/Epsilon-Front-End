import * as SecureStore from '@/lib/session-storage';
import '@/lib/preferences';
import { notifySessionExpired } from '@/lib/runtime-notices';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import {
  bootStorage,
  resolveBootstrapRoute,
  storageKeys,
  type AuthState,
  type BootData,
} from '@/lib/bootstrap';
import { authOperation, clearAuthFlows } from '@/lib/auth-lifecycle';
import { initializeGoogle } from '@/lib/google-signin';
import { SignedInContext } from './signed-in';
import type {
  AuthResult,
  Config,
  NextStep,
  Session,
  User,
} from '@/services/contracts';
import { services } from '@/services';
import { userSchema } from '@/services/contracts';
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
  applyConfig: (config: Config) => void;
  logout: () => Promise<void>;
};
async function readSavedUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(storageKeys.user);
    return raw ? (userSchema.safeParse(JSON.parse(raw)).data ?? null) : null;
  } catch {
    return null;
  }
}
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
  const applyConfig = useCallback(
    (config: Config) => {
      publish({ minimumAge: config.minAge });
    },
    [publish],
  );
  const loadConfig = useCallback(async () => {
    const epoch = authOperation.epoch();
    const config = await queryClient.fetchQuery({
      gcTime: 0,
      // Fail at once when offline instead of pausing the session restore.
      networkMode: 'always',
      queryKey: queryKeys.config.current(),
      queryFn: ({ signal }) => services.config.get({ signal }),
    });
    if (authOperation.current(epoch)) applyConfig(config);
    return config;
  }, [applyConfig, queryClient]);
  const updateUser = useCallback(
    (user: User, nextStep?: NextStep | null) => {
      publish({ user, nextStep: nextStep ?? undefined });
      queryClient.setQueryData(queryKeys.user.profile(), user);
      const epoch = authOperation.epoch();
      // Identities are not needed offline and would outgrow secure storage.
      void persist(async () => {
        if (authOperation.current(epoch) && session.current)
          await SecureStore.setItemAsync(
            storageKeys.user,
            JSON.stringify({ ...user, identities: [] }),
          );
      }).catch(() => undefined);
      return resolveBootstrapRoute(snapshot.current);
    },
    [persist, publish, queryClient],
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
      onLogout: async () => {
        await clearSession();
        notifySessionExpired();
      },
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
    const live = () =>
      active && authOperation.current(epoch) && Boolean(session.current);
    let unsubscribe = () => {};
    const restore = async () => {
      // A saved profile opens the app at once, with or without a network.
      const saved = await readSavedUser();
      if (!live()) return;
      if (saved) {
        updateUser(saved);
        publish({ restoreStatus: undefined });
        setRestored(true);
      }
      try {
        const [user] = await Promise.all([services.user.me(), loadConfig()]);
        if (!live()) return;
        updateUser(user);
        publish({ restoreStatus: undefined });
        setRestored(true);
      } catch {
        if (!live()) return;
        if (!saved) {
          publish({ restoreStatus: 'error' });
          return;
        }
        // Confirm the saved profile as soon as the network returns.
        unsubscribe = onlineManager.subscribe((online) => {
          if (!online) return;
          unsubscribe();
          setRestoreAttempt((attempt) => attempt + 1);
        });
      }
    };
    const timer = setTimeout(() => {
      void restore();
    }, 0);
    return () => {
      active = false;
      unsubscribe();
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
          applyConfig,
          logout,
        }}
      >
        <SignedInContext.Provider value={Boolean(state.session)}>
          {children}
        </SignedInContext.Provider>
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}
