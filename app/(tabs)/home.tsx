import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import HomeScreen from '@/features/home/screens/HomeScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <HomeScreen />
    </AuthBoundary>
  );
}
