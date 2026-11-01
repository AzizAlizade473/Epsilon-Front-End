import type * as Sentry from '@sentry/react-native';
import { scrubCrashEvent, type CrashMetadata } from './crash-scrubber';
import { setErrorReporter } from './error-reporting';
export type CrashSdk = Pick<
  typeof Sentry,
  | 'init'
  | 'captureException'
  | 'close'
  | 'getClient'
  | 'reactNativeErrorHandlersIntegration'
  | 'createReactNativeRewriteFrames'
  | 'debugMetaIntegration'
>;
export type CrashPolicy = {
  dsn: string;
  environment: string;
  developmentAllowed: boolean;
  consent: boolean;
  metadata: CrashMetadata;
};
let closing: Promise<void> = Promise.resolve();
export function createCrashController(
  load: () => Promise<CrashSdk>,
  publish = setErrorReporter,
) {
  let generation = 0;
  let sdk: CrashSdk | null = null;
  let allowed = false;
  const disable = () => {
    allowed = false;
    publish(null);
    const active = sdk;
    sdk = null;
    if (active) {
      const client = active.getClient();
      if (client) client.getOptions().enabled = false;
      closing = closing
        .catch(() => undefined)
        .then(() => active.close())
        .catch(() => undefined);
    }
  };
  return {
    stop() {
      generation += 1;
      disable();
    },
    async configure(policy: CrashPolicy) {
      const version = ++generation;
      disable();
      if (
        !policy.consent ||
        !policy.dsn ||
        (policy.environment === 'development' && !policy.developmentAllowed)
      )
        return;
      const loaded = await load();
      await closing;
      if (version !== generation) return;
      sdk = loaded;
      allowed = true;
      loaded.init({
        dsn: policy.dsn,
        release: policy.metadata.release,
        dist: policy.metadata.dist,
        environment: policy.environment,
        // Native transport persists outside the JS beforeSend/consent boundary. Do not initialize it.
        enableNative: false,
        enableNativeNagger: false,
        patchGlobalPromise: false,
        autoInitializeNativeSdk: false,
        enableNativeCrashHandling: false,
        enableNdk: false,
        enableAutoSessionTracking: false,
        enableAutoPerformanceTracing: false,
        enableAppStartTracking: false,
        enableNativeFramesTracking: false,
        enableStallTracking: false,
        enableUserInteractionTracing: false,
        enableCaptureFailedRequests: false,
        sendDefaultPii: false,
        sendClientReports: false,
        enableLogs: false,
        tracesSampleRate: 0,
        profilesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        tracePropagationTargets: [],
        maxBreadcrumbs: 0,
        attachScreenshot: false,
        attachViewHierarchy: false,
        defaultIntegrations: false,
        integrations: [
          loaded.reactNativeErrorHandlersIntegration({
            onerror: true,
            onunhandledrejection: true,
            patchGlobalPromise: false,
          }),
          loaded.createReactNativeRewriteFrames(),
          loaded.debugMetaIntegration(),
        ],
        beforeSend: (event) =>
          allowed && version === generation
            ? scrubCrashEvent(event, policy.metadata)
            : null,
      });
      publish((error) => {
        if (allowed && version === generation) loaded.captureException(error);
      });
    },
  };
}
