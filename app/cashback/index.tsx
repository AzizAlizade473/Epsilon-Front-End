import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import WalletScreen from '@/features/cashback/screens/WalletScreen';
export default function Route() {
  return (
    <AuthBoundary mode="complete">
      <WalletScreen />
    </AuthBoundary>
  );
}
