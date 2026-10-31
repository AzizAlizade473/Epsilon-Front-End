import Screen from '@/features/auth/screens/PhoneVerifyScreen';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
export default function Route() {
  return (
    <AuthBoundary mode="phone">
      <Screen />
    </AuthBoundary>
  );
}
