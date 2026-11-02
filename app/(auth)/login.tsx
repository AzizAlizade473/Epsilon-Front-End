import Screen from '@/features/auth/screens/AuthEntryScreen';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
export default function Route() {
  return (
    <AuthBoundary mode="signedOut">
      <Screen intent="login" />
    </AuthBoundary>
  );
}
