// Deliberately assemble only the error-reporting client, not the SDK's tracing,
// replay, feedback and React profiling entry point. Keep aligned with the pinned SDK.
import {
  captureException,
  close as closeClient,
  getClient,
  initAndBind,
} from '@sentry/core';
import { defaultStackParser, makeFetchTransport } from '@sentry/browser';
import { ReactNativeClient } from '@sentry/react-native/dist/js/client';
import { reactNativeErrorHandlersIntegration } from '@sentry/react-native/dist/js/integrations/reactnativeerrorhandlers';
import { createReactNativeRewriteFrames } from '@sentry/react-native/dist/js/integrations/rewriteframes';
import { debugMetaIntegration } from '@sentry/react-native/dist/js/integrations/debugmeta';
import { useEncodePolyfill as initializeEncoding } from '@sentry/react-native/dist/js/transports/encodePolyfill';
import type { CrashSdk } from './crash-reporting';

export {
  captureException,
  getClient,
  reactNativeErrorHandlersIntegration,
  createReactNativeRewriteFrames,
  debugMetaIntegration,
};
export const close: CrashSdk['close'] = async () => {
  await closeClient();
};
export const init: CrashSdk['init'] = (options) => {
  initializeEncoding();
  initAndBind(ReactNativeClient, {
    ...options,
    integrations: Array.isArray(options.integrations)
      ? options.integrations
      : [],
    stackParser: defaultStackParser,
    transport: makeFetchTransport,
  });
};
