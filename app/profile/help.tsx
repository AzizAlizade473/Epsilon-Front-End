import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import HelpScreen from '@/features/profile/screens/HelpScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <HelpScreen />
    </AuthBoundary>
  );
}
