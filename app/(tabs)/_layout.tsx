import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { colors, motionTokens, useMotion } from '@/design';
import { TabBar } from '@/components/ui/TabBar';

export const unstable_settings = { anchor: 'home' };

export default function TabsLayout() {
  const { t } = useTranslation();
  const { reduceMotion } = useMotion();
  return (
    <Tabs
      backBehavior="none"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: reduceMotion ? 'none' : 'fade',
        transitionSpec: {
          animation: 'timing',
          config: { duration: motionTokens.tabFadeDuration },
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSecondary,
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('navigation.home') }} />
      <Tabs.Screen
        name="restaurants"
        options={{ title: t('navigation.restaurants') }}
      />
      <Tabs.Screen
        name="cashback"
        options={{ title: t('navigation.cashback') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('navigation.profile') }}
      />
    </Tabs>
  );
}
