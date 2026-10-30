import { z } from 'zod';

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
    EXPO_PUBLIC_PRIVACY_URL: webUrl,
    EXPO_PUBLIC_TERMS_URL: webUrl,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().trim().default(''),
    ENABLE_GOOGLE_SIGNIN: flag,
    ENABLE_APPLE_SIGNIN: flag,
    NON_PRODUCTION_API_URLS: z.string().default(''),
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
