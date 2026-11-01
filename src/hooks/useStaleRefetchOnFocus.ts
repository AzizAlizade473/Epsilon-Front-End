import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useStaleRefetchOnFocus(queryKey: QueryKey) {
  const client = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      void client.refetchQueries(
        { queryKey, type: 'active' },
        { cancelRefetch: false },
      );
    }, [client, queryKey]),
  );
}
