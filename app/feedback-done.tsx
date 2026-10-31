import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { FeedbackDoneScreen } from '@/features/feedback/screens/FeedbackDoneScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <FeedbackDoneScreen />
    </AuthBoundary>
  );
}
