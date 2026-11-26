import { expect, jest, test } from '@jest/globals';
import { scheduleDailyReminders } from '@/services/local-reminders';

const mockSchedule = jest.fn<(request: unknown) => Promise<string>>();
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getAllScheduledNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async () => undefined,
  getPermissionsAsync: async () => ({ granted: true }),
  scheduleNotificationAsync: (request: unknown) => mockSchedule(request),
}));

const ids = () =>
  mockSchedule.mock.calls.map(
    ([request]) => (request as { identifier: string }).identifier,
  );

test('today gets a reminder only while 19:00 is still ahead', async () => {
  await scheduleDailyReminders(true, new Date(2026, 10, 26, 9, 0));
  expect(ids()).toHaveLength(8);
  expect(ids()[0]).toBe('epsilon-reminder-0');
  mockSchedule.mockClear();
  await scheduleDailyReminders(true, new Date(2026, 10, 26, 20, 0));
  expect(ids()).toHaveLength(7);
  expect(ids()[0]).toBe('epsilon-reminder-1');
});
