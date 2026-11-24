import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type * as Notifications from 'expo-notifications';
import { authOperation } from '@/lib/auth-lifecycle';
import { i18n } from '@/lib/i18n';
import { services } from './index';
type NativeNotifications = Pick<
  typeof Notifications,
  | 'getPermissionsAsync'
  | 'requestPermissionsAsync'
  | 'setNotificationChannelAsync'
  | 'getExpoPushTokenAsync'
> & {
  AndroidImportance: Pick<typeof Notifications.AndroidImportance, 'DEFAULT'>;
};
let remotePush: boolean | null = null;
/** null until enable() ran; false when this build cannot receive server pushes. */
export const remotePushAvailable = () => remotePush;

export function createNotificationDevice(
  load: () => Promise<NativeNotifications>,
  projectId: () => string | undefined,
  register: (token: string) => Promise<void>,
  android = Platform.OS === 'android',
) {
  return {
    async readPermission() {
      return (await (await load()).getPermissionsAsync()).granted;
    },
    async enable() {
      const epoch = authOperation.epoch();
      const project = projectId();
      if (!project) throw new Error('Push project is not configured');
      const native = await load();
      if (!authOperation.current(epoch)) return false;
      if (android)
        await native.setNotificationChannelAsync('cashback-updates', {
          name: i18n.t('profile.cashbackUpdates'),
          importance: native.AndroidImportance.DEFAULT,
          enableVibrate: false,
          sound: null,
        });
      if (!authOperation.current(epoch)) return false;
      let permission = await native.getPermissionsAsync();
      if (!permission.granted)
        permission = await native.requestPermissionsAsync();
      if (!permission.granted || !authOperation.current(epoch)) return false;
      // The server sends each kind on its own channel; local reminders use 'reminders'.
      if (android)
        for (const [id, label] of [
          ['reminders', 'notifications.remindersChannel'],
          ['meal_reminder', 'notifications.remindersChannel'],
          ['cashback', 'profile.cashbackUpdates'],
          ['partner', 'profile.partnerUpdates'],
        ] as const)
          await native.setNotificationChannelAsync(id, {
            name: i18n.t(label),
            importance: native.AndroidImportance.DEFAULT,
            enableVibrate: false,
            sound: null,
          });
      // Permission is what the customer granted; a missing push service (no
      // Firebase in this build) must not turn that into an error. Local
      // reminders still work; server pushes start once a token registers.
      try {
        const token = await native.getExpoPushTokenAsync({
          projectId: project,
        });
        if (!authOperation.current(epoch)) return false;
        await register(token.data);
        remotePush = true;
      } catch (cause) {
        remotePush = false;
        if (__DEV__) console.warn('[push] token unavailable', String(cause));
      }
      return authOperation.current(epoch);
    },
  };
}
const device = createNotificationDevice(
  () => import('expo-notifications'),
  () => {
    const value: unknown =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  },
  (token) => services.notification.registerDevice(token),
);
export const readNotificationPermission = device.readPermission;
export const enableDeviceNotifications = device.enable;
