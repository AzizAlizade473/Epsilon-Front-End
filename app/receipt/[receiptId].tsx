import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { ReceiptScreen } from '@/features/receipts/screens/ReceiptScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <ReceiptScreen />
    </AuthBoundary>
  );
}
