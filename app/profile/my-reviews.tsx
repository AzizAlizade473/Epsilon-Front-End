import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import ReviewsScreen from '@/features/profile/screens/ReviewsScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <ReviewsScreen />
    </AuthBoundary>
  );
}
