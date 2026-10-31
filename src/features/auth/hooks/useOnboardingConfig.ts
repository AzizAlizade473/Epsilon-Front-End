import { useQuery } from '@tanstack/react-query';
import { useAuth, useAuthActions } from '@/providers/AuthProvider';
import { queryKeys } from '@/services/query';

export function useOnboardingConfig() {
  const auth = useAuth();
  const { loadConfig } = useAuthActions();
  return useQuery({
    queryKey: queryKeys.config.current(),
    queryFn: loadConfig,
    enabled: Boolean(auth.session),
  });
}
