import { Slot } from 'expo-router';
import * as Splash from 'expo-splash-screen';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { motionTokens } from '@/design';
import { BootstrapGate } from '@/providers/BootstrapGate';

void Splash.preventAutoHideAsync().catch(() => undefined);
Splash.setOptions({ duration: motionTokens.duration.normal, fade: true });

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <BootstrapGate>
        <Slot />
      </BootstrapGate>
    </SafeAreaProvider>
  );
}
