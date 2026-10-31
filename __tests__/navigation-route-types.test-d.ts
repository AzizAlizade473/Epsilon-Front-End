import type { Href } from 'expo-router';

type MustBeFalse<T extends false> = T;
export type UnknownRouteRejected = MustBeFalse<
  '/definitely-not-a-route' extends Href ? true : false
>;
export type MissingReceiptIdRejected = MustBeFalse<
  {
    pathname: '/receipt/[receiptId]';
    params: Record<string, never>;
  } extends Href
    ? true
    : false
>;
