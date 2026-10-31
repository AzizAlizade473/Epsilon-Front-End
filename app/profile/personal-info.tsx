import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import PersonalInfoScreen from '@/features/profile/screens/PersonalInfoScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <PersonalInfoScreen />
    </AuthBoundary>
  );
}
