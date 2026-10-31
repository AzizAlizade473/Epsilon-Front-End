import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import ScanScreen from '@/features/scan/screens/ScanScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <ScanScreen />
    </AuthBoundary>
  );
}
