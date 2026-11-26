import { env } from '@/lib/env';

/** The address comes from configuration only; the subject says it is from the app. */
export const supportMailUrl = (subject: string) =>
  `mailto:${env.EXPO_PUBLIC_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
