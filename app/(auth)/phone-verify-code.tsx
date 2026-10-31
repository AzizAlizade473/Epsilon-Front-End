import Screen from '@/features/auth/screens/OtpScreen';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
export default function Route() {
  return (
    <AuthBoundary mode="phone">
      <Screen mode="link" />
    </AuthBoundary>
  );
}
