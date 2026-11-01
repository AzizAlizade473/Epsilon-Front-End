import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  createCrashController,
  type CrashSdk,
  type CrashPolicy,
} from '@/lib/crash-reporting';
import { scrubCrashEvent } from '@/lib/crash-scrubber';
const metadata = {
  release: 'com.epsilonup.app@0.1.0+1',
  dist: '1',
  environment: 'production',
  appVersion: '0.1.0',
};
const policy: CrashPolicy = {
  dsn: 'https://public@o1.ingest.sentry.io/1',
  environment: 'production',
  developmentAllowed: false,
  consent: true,
  metadata,
};
const init = jest.fn<CrashSdk['init']>((options) => options);
const capture = jest.fn<CrashSdk['captureException']>(() => 'test-event');
const close = jest.fn(async () => undefined);
const sdk: CrashSdk = {
  init,
  captureException: capture,
  close,
  getClient: () => undefined,
  reactNativeErrorHandlersIntegration: () => ({
    name: 'ReactNativeErrorHandlers',
  }),
  createReactNativeRewriteFrames: () => ({ name: 'RewriteFrames' }),
  debugMetaIntegration: () => ({ name: 'DebugMeta' }),
};
beforeEach(() => {
  jest.clearAllMocks();
});
it('drops every arbitrary payload string and retains only safe build metadata and bundle positions', () => {
  const event = scrubCrashEvent(
    {
      message:
        '+994501234567 user@example.com Bearer token 123456 receipt-secret',
      user: { email: 'user@example.com' },
      request: {
        url: 'https://host/purchase?token=secret',
        headers: { Authorization: 'Bearer secret' },
        data: { comment: 'private' },
      },
      breadcrumbs: [
        { message: 'private receipt', data: { phone: '+994501234567' } },
      ],
      extra: { otp: '123456' },
      contexts: { device: { id: 'private-device' } },
      exception: {
        values: [
          {
            type: 'TypeError',
            value: 'private-comment',
            stacktrace: {
              frames: [
                {
                  filename: '/Users/real-name/file?otp=123456',
                  function: 'secret',
                },
                {
                  filename: 'app:///index.android.bundle',
                  lineno: 1,
                  colno: 200,
                  vars: { token: 'secret' },
                },
              ],
            },
          },
        ],
      },
    },
    metadata,
  );
  const json = JSON.stringify(event);
  for (const sensitive of [
    '+994501234567',
    'user@example.com',
    'Bearer',
    '123456',
    'receipt-secret',
    'private',
    'real-name',
    'Authorization',
    'breadcrumbs',
    'request',
  ])
    expect(json).not.toContain(sensitive);
  expect(event.exception.values[0]).toMatchObject({
    type: 'TypeError',
    value: 'Application error',
    stacktrace: {
      frames: [
        { filename: 'app:///index.android.bundle', lineno: 1, colno: 200 },
      ],
    },
  });
});
it.each([
  { consent: false },
  { dsn: '' },
  { environment: 'development', developmentAllowed: false },
])('never loads the SDK when policy disables reporting', async (override) => {
  const load = jest.fn(async () => sdk);
  const driver = createCrashController(load, jest.fn());
  await driver.configure({ ...policy, ...override });
  expect(load).not.toHaveBeenCalled();
  driver.stop();
});
it('disables all auxiliary capture and drops late events immediately after revocation', async () => {
  const publish =
    jest.fn<(reporter: ((error: unknown) => void) | null) => void>();
  const driver = createCrashController(async () => sdk, publish);
  await driver.configure(policy);
  const options = init.mock.calls[0]![0];
  expect(options).toMatchObject({
    enableNative: false,
    enableNativeCrashHandling: false,
    autoInitializeNativeSdk: false,
    defaultIntegrations: false,
    sendDefaultPii: false,
    maxBreadcrumbs: 0,
    tracesSampleRate: 0,
    profilesSampleRate: 0,
    replaysSessionSampleRate: 0,
    enableLogs: false,
    tracePropagationTargets: [],
  });
  const send = publish.mock.calls.at(-1)?.[0];
  send?.(new Error('private'));
  expect(capture).toHaveBeenCalledTimes(1);
  expect(
    await options.beforeSend?.({ type: undefined, message: 'private' }, {}),
  ).not.toHaveProperty('message');
  driver.stop();
  expect(
    await options.beforeSend?.({ type: undefined, message: 'private' }, {}),
  ).toBeNull();
  send?.(new Error('late'));
  expect(capture).toHaveBeenCalledTimes(1);
});
it('does not initialize after consent is revoked during a deferred SDK import', async () => {
  let finish: (value: CrashSdk) => void = () => undefined;
  const driver = createCrashController(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    jest.fn(),
  );
  const pending = driver.configure(policy);
  driver.stop();
  finish(sdk);
  await pending;
  expect(init).not.toHaveBeenCalled();
});
