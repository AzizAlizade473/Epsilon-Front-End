/**
 * 03.d — Services factory / container export.
 *
 * SEC-9: Production builds unconditionally use live HTTP services.
 * Mock services can only be used when:
 * 1. env.EXPO_PUBLIC_APP_ENV !== 'production'
 * 2. env.EXPO_PUBLIC_API_MODE === 'mock'
 */

import { env } from '@/lib/env';
import { httpServices } from './http/services';
import type { ServiceContainer } from './interfaces';

// In step 03.e, mockServices will be implemented.
// For now, if mock is selected in non-prod, we will fallback to httpServices or mockServices.
let _services: ServiceContainer = httpServices;

export function setServiceContainer(container: ServiceContainer): void {
  if (env.EXPO_PUBLIC_APP_ENV === 'production') {
    throw new Error('Overriding services is forbidden in production (SEC-9)');
  }
  _services = container;
}

export function getServices(): ServiceContainer {
  return _services;
}

export const services = {
  get auth() {
    return _services.auth;
  },
  get user() {
    return _services.user;
  },
  get config() {
    return _services.config;
  },
  get restaurant() {
    return _services.restaurant;
  },
  get receipt() {
    return _services.receipt;
  },
  get feedback() {
    return _services.feedback;
  },
  get wallet() {
    return _services.wallet;
  },
  get notification() {
    return _services.notification;
  },
};

export * from './interfaces';
export * from './contracts';
