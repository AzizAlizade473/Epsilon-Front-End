/**
 * 03.d — Service interfaces and container tests.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { services, getServices, setServiceContainer } from '@/services';
import { httpServices } from '@/services/http/services';
import type { ServiceContainer } from '@/services/interfaces';

jest.mock('@/lib/env', () => ({
  env: {
    EXPO_PUBLIC_API_URL: 'https://api.test',
    EXPO_PUBLIC_APP_ENV: 'development',
    EXPO_PUBLIC_API_MODE: 'live',
  },
}));

describe('services container', () => {
  beforeEach(() => {
    setServiceContainer(httpServices);
  });

  it('exposes all required domain services', () => {
    const current = getServices();
    expect(current.auth).toBeDefined();
    expect(current.user).toBeDefined();
    expect(current.config).toBeDefined();
    expect(current.restaurant).toBeDefined();
    expect(current.receipt).toBeDefined();
    expect(current.feedback).toBeDefined();
    expect(current.wallet).toBeDefined();
    expect(current.notification).toBeDefined();
  });

  it('delegates property accesses on `services` proxy to current container', () => {
    expect(services.auth).toBe(httpServices.auth);
    expect(services.user).toBe(httpServices.user);
    expect(services.wallet).toBe(httpServices.wallet);
  });

  it('allows overriding service container in non-production environments', () => {
    const mockContainer = {
      ...httpServices,
      auth: {
        ...httpServices.auth,
        logout: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
    } as ServiceContainer;

    setServiceContainer(mockContainer);
    expect(getServices().auth).toBe(mockContainer.auth);
    expect(services.auth).toBe(mockContainer.auth);
  });
});
