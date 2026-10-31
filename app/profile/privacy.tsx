import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import PrivacyScreen from '@/features/profile/screens/PrivacyScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <PrivacyScreen />
    </AuthBoundary>
  );
}
