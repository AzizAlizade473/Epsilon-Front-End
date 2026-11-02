import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth, useAuthActions } from '@/providers/AuthProvider';
import { queryKeys } from '@/services/query';
import { services } from '@/services';

export function useOnboardingConfig() {
  const auth = useAuth();
  const { applyConfig } = useAuthActions();
  const query = useQuery({
    queryKey: queryKeys.config.current(),
    queryFn: ({ signal }) => services.config.get({ signal }),
    enabled: Boolean(auth.session),
  });
  useEffect(() => {
    if (auth.session && query.data) applyConfig(query.data);
  }, [auth.session, query.data, applyConfig]);
  return query;
}
