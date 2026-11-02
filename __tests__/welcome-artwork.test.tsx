import { afterEach, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { WelcomeArtwork } from '@/features/auth/components/WelcomeArtwork';
let mockReduced = true;
jest.mock('@/design', () => {
  const actual = jest.requireActual<typeof import('@/design')>('@/design');
  return { ...actual, useMotion: () => actual.resolveMotion(mockReduced) };
});
afterEach(() => {
  jest.restoreAllMocks();
});
test.each([true, false])(
  'Welcome respects Reduce Motion=%s',
  async (reduced) => {
    mockReduced = reduced;
    const animate = jest.spyOn(Animated, 'timing');
    await render(<WelcomeArtwork />);
    if (reduced) expect(animate).not.toHaveBeenCalled();
    else expect(animate).toHaveBeenCalled();
  },
);
