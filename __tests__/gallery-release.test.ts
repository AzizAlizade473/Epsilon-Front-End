import { expect, jest, test } from '@jest/globals';

jest.mock('expo-router', () => ({ Redirect: 'Redirect' }));

test('production gallery requests redirect without loading preview components', () => {
  const previous = __DEV__;
  Object.defineProperty(globalThis, '__DEV__', {
    value: false,
    configurable: true,
  });
  try {
    const { default: Route } = jest.requireActual<
      typeof import('../app/_design-gallery')
    >('../app/_design-gallery');
    expect(Route()).toMatchObject({ props: { href: '/' } });
  } finally {
    Object.defineProperty(globalThis, '__DEV__', {
      value: previous,
      configurable: true,
    });
  }
});
