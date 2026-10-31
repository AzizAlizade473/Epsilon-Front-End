import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <ProfileScreen />
    </AuthBoundary>
  );
}
