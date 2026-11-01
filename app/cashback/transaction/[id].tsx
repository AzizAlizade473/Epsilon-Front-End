import * as Clipboard from 'expo-clipboard';
import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { TransactionScreen } from '@/features/cashback/screens/TransactionScreen';
export default function TransactionRoute() {
  return (
    <AuthBoundary mode="complete">
      <TransactionScreen copy={Clipboard.setStringAsync} />
    </AuthBoundary>
  );
}
