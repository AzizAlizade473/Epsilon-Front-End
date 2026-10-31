import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { NotificationsScreen } from '@/features/profile/screens/NotificationsScreen';
import {
  enableDeviceNotifications,
  readNotificationPermission,
} from '@/services/notification-device';
export default function NotificationsRoute() {
  return (
    <AuthBoundary mode="complete">
      <NotificationsScreen
        enableDevice={enableDeviceNotifications}
        readPermission={readNotificationPermission}
      />
    </AuthBoundary>
  );
}
