import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { OfficialReceiptScreen } from '@/features/scan/screens/OfficialReceiptScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <OfficialReceiptScreen />
    </AuthBoundary>
  );
}
