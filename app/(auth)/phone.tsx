import { Redirect } from 'expo-router';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
export default function Route() {
  return (
    <AuthBoundary mode="signedOut">
      <Redirect href="/login" />
    </AuthBoundary>
  );
}
