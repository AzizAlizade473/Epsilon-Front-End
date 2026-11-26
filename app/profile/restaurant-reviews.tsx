import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import StaffReviewsScreen from '@/features/profile/screens/StaffReviewsScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <StaffReviewsScreen />
    </AuthBoundary>
  );
}
