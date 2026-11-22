import { Stack, type NativeStackNavigationOptions } from 'expo-router';

import { colors, useMotion } from '@/design';
import { WalletJourney } from '@/components/wallet/WalletJourney';
import { walletDesign } from '@/design/wallet';

const transparentSheet: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  animation: 'none',
  gestureEnabled: false,
  contentStyle: { backgroundColor: colors.transparent },
};

export function RootNavigator() {
  const { reduceMotion } = useMotion();
  return (
    <WalletJourney>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? 'none' : 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="cashback/index"
          options={{
            animation: 'none',
            // Same colour as the Wallet screen, so the first frame is never the cream default.
            contentStyle: { backgroundColor: walletDesign.colors.canvas },
          }}
        />
        <Stack.Screen
          name="receipt-import"
          options={{
            animation: reduceMotion ? 'none' : 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
        <Stack.Screen name="receipt/[receiptId]" options={transparentSheet} />
        <Stack.Screen
          name="receipts"
          options={{
            presentation: 'fullScreenModal',
            animation: reduceMotion ? 'none' : 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="restaurant/[id]/dish/[dishId]/index"
          options={{
            animation: reduceMotion ? 'none' : 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
        <Stack.Screen name="rate/[receiptItemId]" options={transparentSheet} />
        <Stack.Screen
          name="cashback/transaction/[id]"
          options={transparentSheet}
        />
        <Stack.Screen
          name="feedback-done"
          options={{ animation: 'fade', gestureEnabled: false }}
        />
      </Stack>
    </WalletJourney>
  );
}
