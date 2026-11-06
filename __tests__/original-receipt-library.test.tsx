import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { render, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useReceiptLibrary } from '@/hooks/useReceiptLibrary';
import { mockReceipt } from '@/services/mock/fixtures';
import { queryKeys } from '@/services/query';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import {
  selectReceiptRating,
  selectedReceiptRating,
} from '@/lib/receipt-rating-selection';

const mockGet = jest.fn(async (_id: string) => mockReceipt);
jest.mock('@/services', () => ({
  services: { receipt: { get: (id: string) => mockGet(id) } },
}));
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  mockGet.mockReset().mockResolvedValue(mockReceipt);
});
afterEach(() => client.clear());
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
it('never fabricates a bill or requests an invented history endpoint', async () => {
  const { result } = await renderHook(() => useReceiptLibrary([]), { wrapper });
  expect(result.current.receipts).toEqual([]);
  expect(mockGet).not.toHaveBeenCalled();
});
it('deduplicates real transaction references and includes an actual scanned receipt', async () => {
  client.setQueryData(queryKeys.receipt.detail(mockReceipt.id), mockReceipt);
  const { result } = await renderHook(
    () =>
      useReceiptLibrary([
        mockReceipt.id,
        mockReceipt.id,
        null,
        'https://unsafe.example/token',
      ]),
    { wrapper },
  );
  await waitFor(() => expect(result.current.receipts).toEqual([mockReceipt]));
  expect(mockGet.mock.calls.every(([id]) => id === mockReceipt.id)).toBe(true);
});
it('shows a failed fetch as an error without substituting a receipt', async () => {
  mockGet.mockRejectedValue(new Error('unavailable'));
  const { result } = await renderHook(
    () => useReceiptLibrary(['missing-receipt']),
    {
      wrapper,
    },
  );
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.receipts).toEqual([]);
});
it('hands the selected star across sheets only for that dish and clears it at logout', async () => {
  selectReceiptRating('dish-a', 4);
  expect(selectedReceiptRating('dish-a')).toBe(4);
  expect(selectedReceiptRating('dish-b')).toBe(0);
  await clearAuthFlows();
  expect(selectedReceiptRating('dish-a')).toBe(0);
});
it('can open a second bill list without updating another component during render', async () => {
  const errors = jest.spyOn(console, 'error');
  function Observer({ references }: { references: string[] }) {
    useReceiptLibrary(references);
    return null;
  }
  try {
    const view = await render(
      <QueryClientProvider client={client}>
        <Observer references={[]} />
      </QueryClientProvider>,
    );
    await view.rerender(
      <QueryClientProvider client={client}>
        <Observer references={[]} />
        <Observer references={[mockReceipt.id]} />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(
        client.getQueryData(queryKeys.receipt.detail(mockReceipt.id)),
      ).toEqual(mockReceipt),
    );
    expect(
      errors.mock.calls.some((call) =>
        call.join(' ').includes('Cannot update a component'),
      ),
    ).toBe(false);
  } finally {
    errors.mockRestore();
  }
});
