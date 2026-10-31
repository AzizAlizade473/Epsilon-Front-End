import type { JestNativeMatchers } from '@testing-library/react-native/dist/matchers/types';

declare module 'expect' {
  interface Matchers<
    R extends void | Promise<void>,
  > extends JestNativeMatchers<R> {
    toBeOnTheScreen(): R;
  }
}
