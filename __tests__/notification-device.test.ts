import { beforeEach, expect, it, jest } from '@jest/globals';
import type * as Notifications from 'expo-notifications';
import { createNotificationDevice } from '@/services/notification-device';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { initializeI18n } from '@/lib/i18n';
jest.mock('@/services', () => ({ services: {} }));
type Native = Parameters<
  typeof createNotificationDevice
>[0] extends () => Promise<infer T>
  ? T
  : never;
const permission = (granted: boolean) =>
  ({
    granted,
    status: granted ? 'granted' : 'undetermined',
    canAskAgain: true,
    expires: 'never',
  }) as Notifications.NotificationPermissionsStatus;
const mockRequest = jest.fn(async () => permission(true));
const mockGet = jest.fn(async () => permission(false));
const mockChannel = jest.fn<Native['setNotificationChannelAsync']>(
  async () => null,
);
const mockToken = jest.fn<Native['getExpoPushTokenAsync']>(async () => ({
  type: 'expo',
  data: 'test-push-token',
}));
const mockRegister = jest.fn(async (_token: string) => undefined);
const sdk: Native = {
  getPermissionsAsync: mockGet,
  requestPermissionsAsync: mockRequest,
  setNotificationChannelAsync: mockChannel,
  getExpoPushTokenAsync: mockToken,
  AndroidImportance: { DEFAULT: 5 },
};
beforeEach(async () => {
  jest.clearAllMocks();
  mockGet.mockReset().mockResolvedValue(permission(false));
  mockRequest.mockReset().mockResolvedValue(permission(true));
  mockToken
    .mockReset()
    .mockResolvedValue({ type: 'expo', data: 'test-push-token' });
  await initializeI18n();
});
it('reads OS status without asking permission, then creates one channel and registers only after opt-in', async () => {
  const device = createNotificationDevice(
    async () => sdk,
    () => 'project',
    mockRegister,
    true,
  );
  expect(await device.readPermission()).toBe(false);
  expect(mockRequest).not.toHaveBeenCalled();
  expect(await device.enable()).toBe(true);
  expect(mockChannel).toHaveBeenCalledWith(
    'cashback-updates',
    expect.objectContaining({ enableVibrate: false }),
  );
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(mockRegister).toHaveBeenCalledWith('test-push-token');
});
it('does not register a token after permission denial or missing project configuration', async () => {
  mockRequest.mockResolvedValue(permission(false));
  const device = createNotificationDevice(
    async () => sdk,
    () => 'project',
    mockRegister,
  );
  expect(await device.enable()).toBe(false);
  expect(mockRegister).not.toHaveBeenCalled();
  expect(mockToken).not.toHaveBeenCalled();
  await expect(
    createNotificationDevice(
      async () => sdk,
      () => undefined,
      mockRegister,
    ).enable(),
  ).rejects.toThrow('not configured');
});
it('never registers a token obtained after logout', async () => {
  let finish: (token: Notifications.ExpoPushToken) => void = () => undefined;
  mockToken.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const device = createNotificationDevice(
    async () => sdk,
    () => 'project',
    mockRegister,
  );
  const pending = device.enable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await clearAuthFlows();
  finish({ type: 'expo', data: 'late-token' });
  expect(await pending).toBe(false);
  expect(mockRegister).not.toHaveBeenCalled();
});
