import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { SessionRestore } from '@/components/navigation/SessionRestore';
import { resolveBootstrapRoute } from '@/lib/bootstrap';
import { useAuth } from '@/providers/AuthProvider';

export function AuthBoundary({
  mode,
  children,
}: {
  mode: 'signedOut' | 'profile' | 'phone' | 'complete';
  children: ReactNode;
}) {
  const auth = useAuth();
  if (auth.restoreStatus)
    return (
      <SessionRestore
        failed={auth.restoreStatus === 'error'}
        onRetry={() => auth.retryRestore?.()}
      />
    );
  const target = resolveBootstrapRoute(auth);
  if (mode === 'signedOut')
    return auth.session ? <Redirect href={target} /> : children;
  if (!auth.session) return <Redirect href={target} />;
  if (mode === 'complete')
    return target === '/home' ? children : <Redirect href={target} />;
  if (mode === 'profile')
    return target === '/profile-setup' ? children : <Redirect href={target} />;
  if (target === '/profile-setup' || auth.user?.phoneVerified)
    return <Redirect href={target} />;
  return children;
}
