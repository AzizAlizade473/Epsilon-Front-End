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
