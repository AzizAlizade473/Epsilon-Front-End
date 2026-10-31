import { queryOptions, useQuery } from '@tanstack/react-query';
import { services } from '@/services';
import { queryKeys } from '@/services/query';

export const walletOptions = () =>
  queryOptions({
    queryKey: queryKeys.wallet.summary(),
    queryFn: ({ signal }) => services.wallet.get({ signal }),
  });
export const walletTransactionsOptions = (
  params: { limit?: number; cursor?: string } = {},
) =>
  queryOptions({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: ({ signal }) => services.wallet.transactions(params, { signal }),
  });
export function useWallet() {
  return useQuery(walletOptions());
}
export function useWalletTransactions(
  params: { limit?: number; cursor?: string } = {},
) {
  return useQuery(walletTransactionsOptions(params));
}
