import { describe, expect, it, jest, afterEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  candidate,
  manualCodeSchema,
  scanTransition,
  typedFiscalUrl,
} from '@/features/scan/machine';
import { useScanMachine } from '@/features/scan/hooks/useScanMachine';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { services, type Receipt } from '@/services';
import { mockReceipt } from '@/services/mock/fixtures';
import { createQueryClient, queryKeys } from '@/services/query';
jest.mock('@/services', () => ({
  services: { receipt: { resolve: jest.fn() } },
}));
const clients: ReturnType<typeof createQueryClient>[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe('opaque receipt scanner', () => {
  it('locks resolution and only accepts bounded nonempty candidates without interpreting links', () => {
    expect(scanTransition('scanning', 'detect')).toBe('resolving');
    expect(scanTransition('resolving', 'manual')).toBe('resolving');
    expect(scanTransition('resolving', 'detect')).toBe('resolving');
    expect(scanTransition('resolving', 'resolved')).toBe('success');
    expect(scanTransition('success', 'detect')).toBe('success');
    expect(candidate('qr', 'https://untrusted.test/?secret=raw').success).toBe(
      true,
    );
    expect(candidate('qr', ' ').success).toBe(false);
    expect(candidate('qr', 'x'.repeat(2049)).success).toBe(false);
    expect(manualCodeSchema.parse(' ab 12-34 ')).toBe('ab12-34');
    expect(manualCodeSchema.safeParse('12345').success).toBe(false);
    for (const length of [12, 44])
      expect(manualCodeSchema.parse('aB'.repeat(length / 2))).toHaveLength(
        length,
      );
    expect(manualCodeSchema.safeParse('a'.repeat(45)).success).toBe(false);
    expect(typedFiscalUrl('aB3dE6gH9jK2')).toBe(
      'https://monitoring.e-kassa.gov.az/#/index?doc=aB3dE6gH9jK2',
    );
    expect(typedFiscalUrl('a'.repeat(13))).toBeNull();
    expect(typedFiscalUrl('ab12-34cd-56')).toBeNull();
  });
  it('uses one request for repeated camera reads and primes the receipt cache', async () => {
    const client = createQueryClient();
    clients.push(client);
    let finish: (receipt: Receipt) => void = () => undefined;
    const spy = jest.spyOn(services.receipt, 'resolve').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const hook = await renderHook(() => useScanMachine(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(() => hook.result.current.event('granted'));
    let pending: Promise<Receipt | null> = Promise.resolve(null);
    await act(async () => {
      pending = hook.result.current.resolve('qr', 'opaque');
      await hook.result.current.resolve('qr', 'opaque');
    });
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish(mockReceipt);
      await pending;
    });
    expect(
      client.getQueryData(queryKeys.receipt.detail(mockReceipt.id)),
    ).toEqual(mockReceipt);
    expect(hook.result.current.state).toBe('success');
    spy.mockRestore();
  });
  it.each(['cancel', 'logout'] as const)(
    'ignores late resolution after %s',
    async (kind) => {
      const client = createQueryClient();
      let finish: (receipt: Receipt) => void = () => undefined;
      clients.push(client);
      const spy = jest.spyOn(services.receipt, 'resolve').mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const hook = await renderHook(() => useScanMachine(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      });
      await act(() => hook.result.current.event('granted'));
      let pending: Promise<Receipt | null> = Promise.resolve(null);
      await act(() => {
        pending = hook.result.current.resolve('qr', 'opaque');
      });
      await act(async () => {
        if (kind === 'cancel') hook.result.current.cancel();
        else await clearAuthFlows();
        finish(mockReceipt);
        expect(await pending).toBeNull();
      });
      expect(
        client.getQueryData(queryKeys.receipt.detail(mockReceipt.id)),
      ).toBeUndefined();
      spy.mockRestore();
    },
  );
});

it('shows a device-side failure once and never over a running or shown check', async () => {
  const client = createQueryClient();
  clients.push(client);
  const hook = await renderHook(() => useScanMachine(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await act(() => hook.result.current.event('denied'));
  await act(() => hook.result.current.fail('IMAGE_NO_QR'));
  await act(() => hook.result.current.fail('IMAGE_UNREADABLE'));
  expect(hook.result.current.state).toBe('error');
  expect(hook.result.current.error).toBe('IMAGE_NO_QR');
  await act(async () => {
    expect(await hook.result.current.resolve('qr', 'opaque')).toBeNull();
  });
});
