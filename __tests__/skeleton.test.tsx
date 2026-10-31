import { afterEach, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

import { Skeleton } from '@/components/feedback/Skeleton';
import { layout } from '@/design';

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([true, false])(
  'Skeleton respects Reduce Motion=%s',
  async (reduceMotion) => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(reduceMotion);
    const loop = jest.spyOn(Animated, 'loop');
    await render(
      <Skeleton
        width="100%"
        height={layout.controlHeight}
        accessibilityLabel="Loading"
      />,
    );
    expect(
      screen.getByRole('progressbar', { name: 'Loading' }),
    ).toBeOnTheScreen();
    expect(loop).toHaveBeenCalledTimes(reduceMotion ? 0 : 1);
  },
);
