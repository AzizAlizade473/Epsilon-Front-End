import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { refetchStaleActive } from '@/services/query/freshness';

export function useStaleRefetchOnFocus(queryKey: QueryKey) {
  const client = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      void refetchStaleActive(client, queryKey);
    }, [client, queryKey]),
  );
}
