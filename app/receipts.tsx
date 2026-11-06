import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { BillsScreen } from '@/features/receipts/screens/BillsScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <BillsScreen />
    </AuthBoundary>
  );
}
