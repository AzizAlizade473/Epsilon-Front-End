import { afterEach, expect, it, jest } from '@jest/globals';
import { QueryObserver } from '@tanstack/react-query';
import { createQueryClient } from '@/services/query';
import { refetchStaleActive } from '@/services/query/freshness';
afterEach(() => {
  jest.restoreAllMocks();
});
it('refetches only stale active data using monotonic time despite a wrong wall clock', async () => {
  let now = 100;
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  const client = createQueryClient();
  const queryFn = jest.fn<() => Promise<number>>().mockResolvedValue(1);
  const key = ['wallet', 'summary'];
  await client.fetchQuery({ queryKey: key, queryFn });
  const observer = new QueryObserver(client, {
    queryKey: key,
    queryFn,
    staleTime: 30_000,
  });
  const unsubscribe = observer.subscribe(() => {});
  await refetchStaleActive(client);
  expect(queryFn).toHaveBeenCalledTimes(1);
  jest.spyOn(Date, 'now').mockReturnValue(Date.now() - 60_000);
  now += 30_001;
  await Promise.all([refetchStaleActive(client), refetchStaleActive(client)]);
  expect(queryFn).toHaveBeenCalledTimes(2);
  await client.invalidateQueries({ queryKey: key, refetchType: 'none' });
  await refetchStaleActive(client);
  expect(queryFn).toHaveBeenCalledTimes(3);
  unsubscribe();
  now += 60_000;
  await refetchStaleActive(client);
  expect(queryFn).toHaveBeenCalledTimes(3);
  client.clear();
});
