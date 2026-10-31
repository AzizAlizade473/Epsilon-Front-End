import { Redirect } from 'expo-router';
import { SessionRestore } from '@/components/navigation/SessionRestore';
import { resolveBootstrapRoute } from '@/lib/bootstrap';
import { useAuth } from '@/providers/RuntimeProviders';

export default function Bootstrap() {
  const auth = useAuth();
  if (auth.restoreStatus)
    return (
      <SessionRestore
        failed={auth.restoreStatus === 'error'}
        onRetry={() => auth.retryRestore?.()}
      />
    );
  const target = resolveBootstrapRoute(auth);
  return <Redirect href={target} />;
}
