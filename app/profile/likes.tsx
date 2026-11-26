import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import LikedScreen from '@/features/profile/screens/LikedScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <LikedScreen />
    </AuthBoundary>
  );
}
