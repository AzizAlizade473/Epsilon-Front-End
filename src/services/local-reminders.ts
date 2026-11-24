import { Platform } from 'react-native';
import { registerAuthCleanup } from '@/lib/auth-lifecycle';
import { i18n } from '@/lib/i18n';

/**
 * The gentle daily nudge, scheduled on the phone: one per day at 19:00 local
 * time, for the next week, a different message each day. Rescheduling on every
 * app start always begins tomorrow, so a day the customer already opened
 * Epsilon gets no reminder. Meal-specific reminders come from the server.
 */
const PREFIX = 'epsilon-reminder-';
const DAYS = 7;
const HOUR = 19;
const MESSAGES = 8;

async function cancelReminders() {
  const native = await import('expo-notifications');
  const scheduled = await native.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((entry) => entry.identifier.startsWith(PREFIX))
      .map((entry) =>
        native.cancelScheduledNotificationAsync(entry.identifier),
      ),
  );
}

export async function scheduleDailyReminders(
  enabled: boolean,
  now = new Date(),
) {
  if (Platform.OS === 'web') return;
  const native = await import('expo-notifications');
  await cancelReminders();
  if (!enabled || !(await native.getPermissionsAsync()).granted) return;
  const start = Math.floor(now.getTime() / 86_400_000);
  for (let day = 1; day <= DAYS; day += 1) {
    const at = new Date(now);
    at.setDate(now.getDate() + day);
    at.setHours(HOUR, 0, 0, 0);
    const n = ((start + day) % MESSAGES) + 1;
    await native.scheduleNotificationAsync({
      identifier: `${PREFIX}${day}`,
      content: {
        title: i18n.t(`notifications.daily.${n}.title`),
        body: i18n.t(`notifications.daily.${n}.body`),
        data: { path: '/scan' },
      },
      trigger: {
        type: native.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: 'reminders',
      },
    });
  }
}

// Signing out must stop the previous account's reminders on this phone.
registerAuthCleanup(() => cancelReminders().catch(() => undefined));
