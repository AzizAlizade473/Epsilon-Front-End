import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';

/** Where a notification may take the customer; anything else opens Home. */
const SAFE_PATH =
  /^\/(home|scan|profile\/my-reviews|profile\/notifications|receipt\/[\w-]{1,128}|restaurant\/[\w-]{1,128}|cashback\/transaction\/[\w-]{1,128})$/;

export const notificationTarget = (data: unknown): string => {
  const path =
    data && typeof data === 'object' && 'path' in data
      ? (data as { path: unknown }).path
      : null;
  return typeof path === 'string' && SAFE_PATH.test(path) ? path : '/home';
};

/**
 * Shows notifications while the app is open and opens the screen a tapped one
 * points to (also when the tap launched the app).
 */
export function NotificationRouter() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    let remove = () => {};
    void import('expo-notifications')
      .then((native) => {
        if (!active) return;
        native.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
        const open = (data: unknown) =>
          router.push(notificationTarget(data) as Href);
        void native
          .getLastNotificationResponseAsync()
          .then((response) => {
            if (active && response)
              open(response.notification.request.content.data);
          })
          .catch(() => undefined);
        const subscription = native.addNotificationResponseReceivedListener(
          (response) => open(response.notification.request.content.data),
        );
        remove = () => subscription?.remove?.();
      })
      // Notifications are an extra: a missing or failing module never breaks navigation.
      .catch(() => undefined);
    return () => {
      active = false;
      remove();
    };
  }, [router]);
  return null;
}
