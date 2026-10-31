import Screen from '@/features/auth/screens/ProfileSetupScreen';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
export default function Route() {
  return (
    <AuthBoundary mode="profile">
      <Screen />
    </AuthBoundary>
  );
}
