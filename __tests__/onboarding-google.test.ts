import { expect, it, jest } from '@jest/globals';
import { createGoogleDriver, type GoogleSdk } from '@/lib/google-signin';
import type { SignInResponse } from '@react-native-google-signin/google-signin';

function setup(enabled = true) {
  const response: SignInResponse = {
    type: 'success',
    data: {
      idToken: 'test-provider-token',
      serverAuthCode: null,
      scopes: ['openid', 'email', 'profile'],
      user: {
        id: 'test-id',
        name: null,
        givenName: null,
        familyName: null,
        photo: null,
        email: 'test@example.test',
      },
    },
  };
  const sdk: GoogleSdk = {
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest
        .fn<GoogleSdk['GoogleSignin']['hasPlayServices']>()
        .mockResolvedValue(true),
      signIn: jest
        .fn<GoogleSdk['GoogleSignin']['signIn']>()
        .mockResolvedValue(response),
      signOut: jest
        .fn<GoogleSdk['GoogleSignin']['signOut']>()
        .mockResolvedValue(null),
    },
    statusCodes: {
      SIGN_IN_CANCELLED: 'CANCELLED',
      IN_PROGRESS: 'BUSY',
      PLAY_SERVICES_NOT_AVAILABLE: 'PLAY',
      SIGN_IN_REQUIRED: 'REQUIRED',
    },
  };
  const load = jest.fn(async () => sdk);
  return {
    sdk,
    response,
    load,
    driver: createGoogleDriver(
      load,
      () => enabled,
      () => 'test.apps.googleusercontent.com',
    ),
  };
}
it('does not load native code when disabled, including logout', async () => {
  const { driver, load } = setup(false);
  await driver.prepare();
  await driver.signOut();
  expect(load).not.toHaveBeenCalled();
});
it('configures once, exchanges only the ID token, and releases the provider result', async () => {
  const { driver, sdk, response } = setup();
  await Promise.all([driver.prepare(), driver.prepare()]);
  const send = jest.fn(async (_token: string) => 'server-result');
  expect(await driver.exchange(send)).toBe('server-result');
  expect(sdk.GoogleSignin.configure).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith('test-provider-token');
  expect(response.type === 'success' && response.data.idToken).toBeNull();
  await driver.signOut();
  expect(sdk.GoogleSignin.signOut).toHaveBeenCalledTimes(1);
});
it('treats cancellation silently and never contacts the backend', async () => {
  const { driver, sdk } = setup();
  jest
    .mocked(sdk.GoogleSignin.signIn)
    .mockResolvedValue({ type: 'cancelled', data: null });
  const send = jest.fn(async (_token: string) => 'unexpected');
  expect(await driver.exchange(send)).toBeNull();
  expect(send).not.toHaveBeenCalled();
});
it.each([
  ['PLAY', 'googlePlayServices'],
  ['REQUIRED', 'googleNoAccount'],
  ['7', 'googleNetwork'],
  ['DEVELOPER_ERROR', 'googleFailed'],
])(
  'maps native %s without surfacing raw provider details',
  async (code, key) => {
    const { driver, sdk } = setup();
    jest
      .mocked(sdk.GoogleSignin.signIn)
      .mockRejectedValue({ code, message: 'private provider details' });
    await expect(driver.exchange(async () => 'unused')).rejects.toMatchObject({
      key,
    });
  },
);
it('rejects a missing ID token without creating a session', async () => {
  const { driver, response } = setup();
  if (response.type === 'success') response.data.idToken = null;
  const send = jest.fn(async (_token: string) => 'unused');
  await expect(driver.exchange(send)).rejects.toMatchObject({
    key: 'googleFailed',
  });
  expect(send).not.toHaveBeenCalled();
});
