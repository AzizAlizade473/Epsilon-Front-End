import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { Easing } from 'react-native';

import { colors, motionTokens, useMotion } from '@/design';
import { walletDesign } from '@/design/wallet';
import { TabBar } from '@/components/ui/TabBar';
import { TabSwipe } from '@/components/navigation/TabSwipe';

export const unstable_settings = { anchor: 'home' };

export default function TabsLayout() {
  const { t } = useTranslation();
  const { reduceMotion } = useMotion();
  return (
    <Tabs
      backBehavior="firstRoute"
      tabBar={(props) => <TabBar {...props} />}
      screenLayout={({ route, navigation, children }) => (
        <TabSwipe
          route={route.name}
          onSwipe={(target) => navigation.navigate(target)}
        >
          {children}
        </TabSwipe>
      )}
      screenOptions={{
        headerShown: false,
        // Plain cross-fade. A slide exposes the gap between differently coloured
        // scenes (navy Home vs cream tabs); a fade between two opaque scenes cannot.
        animation: reduceMotion ? 'none' : 'fade',
        // Opaque scene colour per tab so no frame ever shows the navigator default.
        sceneStyle: { backgroundColor: colors.background },
        // Inactive tabs keep state but stop rendering work.
        freezeOnBlur: true,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: motionTokens.tabFadeDuration,
            easing: Easing.out(Easing.cubic),
          },
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSecondary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('navigation.home'),
          sceneStyle: { backgroundColor: walletDesign.colors.canvas },
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{ title: t('navigation.restaurants') }}
      />
      <Tabs.Screen name="scan" options={{ title: t('navigation.scan') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: t('navigation.profile') }}
      />
    </Tabs>
  );
}
