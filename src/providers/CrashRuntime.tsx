import Constants from 'expo-constants';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { registerAuthCleanup } from '@/lib/auth-lifecycle';
import { env } from '@/lib/env';
import { afterFirstFrame } from '@/lib/after-first-frame';
import { createCrashController } from '@/lib/crash-reporting';
import { onCrashConsentChange, readCrashConsent } from '@/lib/preferences';
import packageJson from '../../package.json';
export function CrashRuntime() {
  const { user } = useAuth();
  const owner = user?.id;
  useEffect(() => {
    const driver = createCrashController(() => import('@/lib/crash-sdk'));
    let active = true;
    let ready = false;
    let consent = false;
    let changed = false;
    const configure = () => {
      if (!active || !ready) return;
      const appVersion = Constants.expoConfig?.version ?? packageJson.version;
      const dist = String(
        Constants.platform?.android?.versionCode ??
          Constants.expoConfig?.android?.versionCode ??
          'development',
      );
      const release = `${Constants.expoConfig?.android?.package ?? 'com.epsilonup.app'}@${appVersion}+${dist}`;
      void driver
        .configure({
          dsn: env.EXPO_PUBLIC_SENTRY_DSN,
          environment: env.EXPO_PUBLIC_APP_ENV,
          developmentAllowed: env.ENABLE_CRASH_REPORTING_DEV,
          consent: Boolean(owner && consent),
          metadata: {
            release,
            dist,
            appVersion,
            environment: env.EXPO_PUBLIC_APP_ENV,
          },
        })
        .catch(() => {
          if (active) driver.stop();
        });
    };
    const unsubscribe = onCrashConsentChange((changedOwner, value) => {
      if (changedOwner === null || changedOwner === owner) {
        changed = true;
        consent = value;
        if (!value) driver.stop();
        configure();
      }
    });
    const unregister = registerAuthCleanup(() => driver.stop());
    const cancel = afterFirstFrame(() => {
      ready = true;
      if (changed) {
        configure();
        return;
      }
      if (owner)
        void readCrashConsent(owner)
          .then((value) => {
            if (active && !changed) {
              consent = value;
              configure();
            }
          })
          .catch(() => driver.stop());
    });
    return () => {
      active = false;
      cancel();
      unsubscribe();
      unregister();
      driver.stop();
    };
  }, [owner]);
  return null;
}
