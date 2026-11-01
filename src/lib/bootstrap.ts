import * as SecureStore from './session-storage';
import { z } from 'zod';

export const storageKeys = {
  session: 'epsilon.session',
  onboarding: 'epsilon.onboarding.completed',
  language: 'epsilon.language',
} as const;

const sessionSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresAt: z.iso.datetime(),
  })
  .strict();

export type BootSession = z.infer<typeof sessionSchema>;
export type BootData = {
  session: BootSession | null;
  onboardingComplete: boolean;
};

export type NavigationUser = {
  id?: string;
  firstName: string | null;
  birthDate: string | null;
  phoneVerified: boolean;
  lastName?: string | null;
  email?: string | null;
  language?: string;
};

export type AuthState = BootData & {
  user: NavigationUser | null;
  requirePhoneVerification: boolean;
  minimumAge?: number;
  nextStep?: 'profile' | 'phone' | 'home';
  restoreStatus?: 'loading' | 'error';
  retryRestore?: () => void;
};

export type BootstrapRoute =
  '/welcome' | '/phone' | '/profile-setup' | '/phone-verify' | '/home';

export function resolveBootstrapRoute(auth: AuthState): BootstrapRoute {
  if (!auth.onboardingComplete) {
    return '/welcome';
  }
  if (!auth.session) {
    return '/phone';
  }
  if (auth.nextStep === 'profile') return '/profile-setup';
  if (!auth.user?.firstName || !auth.user?.birthDate) {
    return '/profile-setup';
  }
  if (auth.requirePhoneVerification && !auth.user.phoneVerified) {
    return '/phone-verify';
  }
  if (auth.nextStep === 'phone') return '/phone-verify';
  return '/home';
}

function parseSession(raw: string | null): BootSession | null {
  if (!raw) return null;
  try {
    const result = sessionSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Single boot read, including Strict Mode mounts. Never interprets token expiry. */
export function createBootReader(
  read: (key: string) => Promise<string | null>,
) {
  let pending: Promise<BootData> | undefined;
  return {
    read() {
      pending ??= Promise.all([
        read(storageKeys.session),
        read(storageKeys.onboarding),
      ])
        .then(([session, onboarding]) => ({
          session: parseSession(session),
          onboardingComplete: onboarding === 'true',
        }))
        .catch((error: unknown) => {
          pending = undefined;
          throw error;
        });
      return pending;
    },
    // Auth cleanup must release the cached token references too (STEP 19).
    clear() {
      pending = undefined;
    },
  };
}

export const bootStorage = createBootReader((key) =>
  SecureStore.getItemAsync(key),
);
