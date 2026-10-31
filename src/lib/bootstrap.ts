import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

export const storageKeys = {
  session: 'epsilon.session',
  onboarding: 'epsilon.onboarding.completed',
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
