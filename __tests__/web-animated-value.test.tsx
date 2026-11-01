import { expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue.web';

it('keeps one browser Animated.Value across renders and preserves animation updates', async () => {
  const hook = await renderHook(
    ({ initial }: { initial: number }) => useAnimatedValue(initial),
    {
      initialProps: { initial: 1 },
    },
  );
  const value = hook.result.current;
  const changed = jest.fn();
  const subscription = value.addListener(changed);
  await act(async () => {
    value.setValue(0.8);
  });
  await hook.rerender({ initial: 9 });
  expect(hook.result.current).toBe(value);
  expect(changed).toHaveBeenCalledWith({ value: 0.8 });
  value.removeListener(subscription);
});
