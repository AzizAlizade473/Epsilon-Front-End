import 'react-native-gesture-handler/jestSetup';
import { jest } from '@jest/globals';

jest.mock('react-native-reanimated', () =>
  jest.requireActual<typeof import('react-native-reanimated')>(
    'react-native-reanimated/mock',
  ),
);

jest.mock('react-native-worklets', () => {
  const actual = jest.requireActual<typeof import('react-native-worklets')>(
    'react-native-worklets',
  );
  return {
    ...actual,
    getUIRuntimeHolder: () => ({}),
    getUISchedulerHolder: () => ({}),
  };
});

jest.mock('@react-native-community/netinfo', () =>
  jest.requireActual<typeof import('@react-native-community/netinfo')>(
    '@react-native-community/netinfo/jest/netinfo-mock',
  ),
);

// Provide a deterministic stub for expo-localization so that
// resolveInitialLanguage() falls back to 'az' (the project default) in all
// test files that do not explicitly override this mock.
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => []),
}));

// Provide a no-op stub for expo-secure-store so storage reads return null
// (no saved preference) and writes succeed silently in all test files that do
// not explicitly override this mock.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));
