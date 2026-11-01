import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen title={t('navigation.notFound')}>
      <Text>{t('resilience.notFoundBody')}</Text>
      <Button
        label={t('feedback.home')}
        onPress={() => {
          router.dismissAll();
          router.replace('/home');
        }}
      />
    </Screen>
  );
}
