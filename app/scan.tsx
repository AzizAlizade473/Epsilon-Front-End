import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler } from 'react-native';

import { BackButton } from '@/components/navigation/BackButton';
import { Screen } from '@/components/ui/Screen';

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        router.back();
        return true;
      },
    );
    return () => subscription.remove();
  }, [router]);

  return (
    <Screen
      title={t('navigation.scan')}
      leading={<BackButton modal onPress={() => router.back()} />}
    >
      {null}
    </Screen>
  );
}
