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
import { mockServices } from './mock/services';
import type { ServiceContainer } from './interfaces';

let _services: ServiceContainer | undefined;

export function setServiceContainer(container: ServiceContainer): void {
  if (env.EXPO_PUBLIC_APP_ENV === 'production') {
    throw new Error('Overriding services is forbidden in production (SEC-9)');
  }
  _services = container;
}

export function getServices(): ServiceContainer {
  return (_services ??=
    env.EXPO_PUBLIC_APP_ENV !== 'production' &&
    env.EXPO_PUBLIC_API_MODE === 'mock'
      ? mockServices
      : httpServices);
}

export const services = {
  get auth() {
    return getServices().auth;
  },
  get user() {
    return getServices().user;
  },
  get config() {
    return getServices().config;
  },
  get restaurant() {
    return getServices().restaurant;
  },
  get receipt() {
    return getServices().receipt;
  },
  get feedback() {
    return getServices().feedback;
  },
  get wallet() {
    return getServices().wallet;
  },
  get notification() {
    return getServices().notification;
  },
};

export * from './interfaces';
export * from './contracts';
