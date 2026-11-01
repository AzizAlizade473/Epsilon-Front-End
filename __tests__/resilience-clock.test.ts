import { afterEach, expect, it, jest } from '@jest/globals';
import { requiresAppUpdate } from '@/lib/app-version';
import {
  observeServerDate,
  serverNow,
  resetServerClockForTesting,
  monotonicNow,
} from '@/lib/server-clock';
import { otpChallenge } from '@/features/auth/store';
import { afterFirstFrame } from '@/lib/after-first-frame';
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  resetServerClockForTesting();
  otpChallenge.clear();
});
it('uses server-anchored elapsed time and monotonic cooldowns despite a wrong device date', () => {
  jest.useFakeTimers();
  const timestamp = Date.parse('2026-11-01T00:00:00Z');
  observeServerDate(new Date(timestamp).toUTCString());
  otpChallenge.set('+994501234567', 60);
  const deadline = otpChallenge.get()!.resendAt;
  jest.setSystemTime(new Date('2099-01-01'));
  expect(serverNow().getTime()).toBe(timestamp);
  expect(deadline - monotonicNow()).toBe(60000);
  expect(requiresAppUpdate('0.1.0', '0.2.0')).toBe(true);
  jest.advanceTimersByTime(61000);
  expect(serverNow().getTime()).toBe(timestamp + 61000);
  expect(deadline).toBeLessThan(monotonicNow());
});
it.each([
  ['1.10.0', '1.9.0', false],
  ['1.0.0-beta.2', '1.0.0-beta.10', true],
  ['1.0.0', '1.0.0-beta.1', false],
  ['1.0.0+build', '1.0.0', false],
  ['invalid', '1.0.0', true],
])(
  'compares app versions without device time',
  (current, minimum, expected) => {
    expect(requiresAppUpdate(String(current), String(minimum))).toBe(expected);
  },
);
it('defers reporting until two frame boundaries and a task, and supports cancellation', () => {
  jest.useFakeTimers();
  const task = jest.fn();
  const cancel = afterFirstFrame(task);
  expect(task).not.toHaveBeenCalled();
  cancel();
  jest.runAllTimers();
  expect(task).not.toHaveBeenCalled();
  const frames: FrameRequestCallback[] = [];
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
  afterFirstFrame(task);
  frames.shift()?.(0);
  expect(task).not.toHaveBeenCalled();
  frames.shift()?.(16);
  expect(task).not.toHaveBeenCalled();
  jest.runOnlyPendingTimers();
  expect(task).toHaveBeenCalledTimes(1);
});
