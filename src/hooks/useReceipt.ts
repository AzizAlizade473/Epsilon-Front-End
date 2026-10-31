import { useQuery } from '@tanstack/react-query';
import { safeIdSchema } from '@/lib/deep-link';
import { services } from '@/services';
import { queryKeys } from '@/services/query';

export function useReceipt(id: string) {
  return useQuery({
    queryKey: queryKeys.receipt.detail(id),
    enabled: safeIdSchema.safeParse(id).success,
    queryFn: ({ signal }) =>
      services.receipt.get(safeIdSchema.parse(id), { signal }),
  });
}
