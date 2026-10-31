import { Redirect } from 'expo-router';

import { resolveBootstrapRoute } from '@/lib/bootstrap';
import { useAuth } from '@/providers/RuntimeProviders';

export default function Bootstrap() {
  const auth = useAuth();
  const target = resolveBootstrapRoute(auth);
  return <Redirect href={target} />;
}
