import { Stack, type NativeStackNavigationOptions } from 'expo-router';

import { colors, useMotion } from '@/design';

const transparentSheet: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  animation: 'none',
  gestureEnabled: false,
  contentStyle: { backgroundColor: colors.transparent },
};

export function RootNavigator() {
  const { reduceMotion } = useMotion();
  return (
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
        name="scan"
        options={{
          presentation: 'fullScreenModal',
          animation: reduceMotion ? 'fade' : 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="receipt/[receiptId]"
        options={{ presentation: 'card' }}
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
  );
}
