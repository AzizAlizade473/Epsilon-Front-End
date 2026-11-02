import Screen from '@/features/auth/screens/PhoneScreen';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
export default function Route() {
  return (
    <AuthBoundary mode="signedOut">
      <Screen />
    </AuthBoundary>
  );
}
