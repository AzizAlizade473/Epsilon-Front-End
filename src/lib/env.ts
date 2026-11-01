import { z } from 'zod';
import Constants from 'expo-constants';

import { isProductionApiUrl } from './production-url';

const flag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
const webUrl = z.url({ protocol: /^https?$/ }).refine((value) => {
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}, 'Use a URL without credentials, query parameters, or fragments');
const schema = z
  .object({
    EXPO_PUBLIC_API_URL: webUrl,
    EXPO_PUBLIC_API_MODE: z.enum(['mock', 'live']),
    EXPO_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
    EXPO_PUBLIC_MIN_AGE: z.coerce.number().int().positive().default(16),
    EXPO_PUBLIC_SUPPORT_EMAIL: z.email(),
    EXPO_PUBLIC_PRIVACY_URL: webUrl.refine(
      (value) => /^https:\/\//i.test(value),
      'Legal URLs require HTTPS',
    ),
    EXPO_PUBLIC_TERMS_URL: webUrl.refine(
      (value) => /^https:\/\//i.test(value),
      'Legal URLs require HTTPS',
    ),
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().trim().default(''),
    ENABLE_GOOGLE_SIGNIN: flag,
    ENABLE_APPLE_SIGNIN: flag,
    NON_PRODUCTION_API_URLS: z.string().default(''),
    EXPO_PUBLIC_SENTRY_DSN: z
      .string()
      .default('')
      .refine((value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          const key = url.username;
          if (
            !key ||
            url.password ||
            url.search ||
            url.hash ||
            !/^\/[\w/-]*\d+$/.test(url.pathname)
          )
            return false;
          url.username = '';
          return isProductionApiUrl(url.toString());
        } catch {
          return false;
        }
      }),
    ENABLE_CRASH_REPORTING_DEV: flag,
  })
  .superRefine((env, context) => {
    if (
      env.ENABLE_GOOGLE_SIGNIN &&
      !/^[\w-]+\.apps\.googleusercontent\.com$/.test(
        env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'],
        message: 'Google sign-in requires its web client ID',
      });
    }
    if (env.EXPO_PUBLIC_APP_ENV === 'production') {
      if (env.EXPO_PUBLIC_API_MODE !== 'live') {
        context.addIssue({
          code: 'custom',
          path: ['EXPO_PUBLIC_API_MODE'],
          message: 'Production requires live mode',
        });
      }
      const excluded = env.NON_PRODUCTION_API_URLS.split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (!isProductionApiUrl(env.EXPO_PUBLIC_API_URL, excluded)) {
        context.addIssue({
          code: 'custom',
          path: ['EXPO_PUBLIC_API_URL'],
          message: 'Production requires a public HTTPS API domain',
        });
      }
    }
  });

export type Environment = z.infer<typeof schema>;

export function parseEnv(
  source: Readonly<Record<string, unknown>>,
): Environment {
  const isProductionBuild =
    source.EAS_BUILD_PROFILE === 'production' ||
    source.EAS_ENVIRONMENT === 'production';
  if (isProductionBuild && source.EXPO_PUBLIC_APP_ENV !== 'production') {
    throw new Error(
      'Invalid environment: EXPO_PUBLIC_APP_ENV must be production',
    );
  }
  const result = schema.safeParse(source);
  if (!result.success) {
    // SEC-3: report field names only; never echo configuration values.
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(`Invalid environment fields: ${fields.join(', ')}`);
  }
  return result.data;
}

let cachedEnv: Environment | null = null;

export function validateEnv(
  source: Readonly<Record<string, unknown>> = process.env,
): Environment {
  return parseEnv(source);
}

export function getEnv(): Environment {
  if (!cachedEnv) {
    const flags = z
      .object({
        google: z.boolean(),
        apple: z.boolean(),
        crashDevelopment: z.boolean().optional(),
      })
      .safeParse(Constants.expoConfig?.extra?.epsilonFlags);
    const source = process.env;
    cachedEnv = validateEnv({
      ...source,
      EXPO_PUBLIC_API_URL:
        process.env.EXPO_PUBLIC_API_URL ?? source.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_API_MODE:
        process.env.EXPO_PUBLIC_API_MODE ?? source.EXPO_PUBLIC_API_MODE,
      EXPO_PUBLIC_APP_ENV:
        process.env.EXPO_PUBLIC_APP_ENV ?? source.EXPO_PUBLIC_APP_ENV,
      EXPO_PUBLIC_MIN_AGE:
        process.env.EXPO_PUBLIC_MIN_AGE ?? source.EXPO_PUBLIC_MIN_AGE,
      EXPO_PUBLIC_SUPPORT_EMAIL:
        process.env.EXPO_PUBLIC_SUPPORT_EMAIL ??
        source.EXPO_PUBLIC_SUPPORT_EMAIL,
      EXPO_PUBLIC_PRIVACY_URL:
        process.env.EXPO_PUBLIC_PRIVACY_URL ?? source.EXPO_PUBLIC_PRIVACY_URL,
      EXPO_PUBLIC_TERMS_URL:
        process.env.EXPO_PUBLIC_TERMS_URL ?? source.EXPO_PUBLIC_TERMS_URL,
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      ...(flags.success
        ? {
            ENABLE_GOOGLE_SIGNIN: String(flags.data.google),
            ENABLE_APPLE_SIGNIN: String(flags.data.apple),
            ENABLE_CRASH_REPORTING_DEV: String(
              flags.data.crashDevelopment ?? false,
            ),
          }
        : {}),
    });
  }
  return cachedEnv;
}

export function resetEnvForTesting(): void {
  cachedEnv = null;
}

export const env: Environment = new Proxy({} as Environment, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'string') {
      const active = getEnv();
      return active[prop as keyof Environment];
    }
    return undefined;
  },
});
