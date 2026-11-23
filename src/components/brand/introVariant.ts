import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import { AccessibilityInfo } from 'react-native';

/**
 * full  — the drawn logo intro, on every cold start (not on resume from background:
 *         the boot gate mounts once per app process).
 * short — the finished mark with the wordmark reveal (builds without the video module).
 * still — Reduce Motion: a calm fade, no movement.
 */
export type IntroVariant = 'full' | 'short' | 'still';

export const INTRO_SEEN_KEY = 'epsilon.intro.seenVersion';

/** Builds without the native video module (older APKs) fall back to the short intro. */
export const introVideoAvailable = (): boolean =>
  requireOptionalNativeModule('ExpoVideo') != null;

export const appVersion = (): string => Constants.expoConfig?.version ?? 'dev';

export function chooseIntroVariant(input: {
  seenVersion: string | null;
  version: string;
  reduceMotion: boolean;
  videoAvailable: boolean;
}): IntroVariant {
  if (input.reduceMotion) return 'still';
  return input.videoAvailable ? 'full' : 'short';
}

/** Never throws: an unreadable preference just means the short intro. */
export async function decideIntroVariant(): Promise<IntroVariant> {
  const [seenVersion, reduceMotion] = await Promise.all([
    AsyncStorage.getItem(INTRO_SEEN_KEY).catch(() => appVersion()),
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
  ]);
  return chooseIntroVariant({
    seenVersion,
    version: appVersion(),
    reduceMotion,
    videoAvailable: introVideoAvailable(),
  });
}

export async function markIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(INTRO_SEEN_KEY, appVersion()).catch(
    () => undefined,
  );
}
