import { AuthBoundary } from '@/features/auth/components/AuthBoundary';
import { TransactionScreen } from '@/features/cashback/screens/TransactionScreen';
export default function TransactionRoute() {
  return (
    <AuthBoundary mode="complete">
      <TransactionScreen
        copy={async (value) =>
          (await import('expo-clipboard')).setStringAsync(value)
        }
      />
    </AuthBoundary>
  );
}
