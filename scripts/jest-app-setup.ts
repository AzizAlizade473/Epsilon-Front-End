import { jest } from '@jest/globals';

jest.mock('@react-native-community/netinfo', () =>
  jest.requireActual<typeof import('@react-native-community/netinfo')>(
    '@react-native-community/netinfo/jest/netinfo-mock',
  ),
);
