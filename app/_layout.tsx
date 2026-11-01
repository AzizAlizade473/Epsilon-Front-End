import * as Splash from 'expo-splash-screen';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { motionTokens } from '@/design';
import { BootstrapGate } from '@/providers/BootstrapGate';
import { RootNavigator } from '@/components/navigation/RootNavigator';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { SessionExpiryNavigation } from '@/components/navigation/SessionExpiryNavigation';

void Splash.preventAutoHideAsync().catch(() => undefined);
Splash.setOptions({ duration: motionTokens.duration.normal, fade: true });

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppErrorBoundary>
        <BootstrapGate>
          <SessionExpiryNavigation />
          <RootNavigator />
        </BootstrapGate>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
