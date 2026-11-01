import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import LanguageScreen from '@/features/profile/screens/LanguageScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <LanguageScreen />
    </AuthBoundary>
  );
}
