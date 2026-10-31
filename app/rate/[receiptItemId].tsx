import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { RateScreen } from '@/features/feedback/screens/RateScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <RateScreen />
    </AuthBoundary>
  );
}
