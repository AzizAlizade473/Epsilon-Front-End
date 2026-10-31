import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';
import { ListRow } from '@/components/ui/ListRow';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { env } from '@/lib/env';
import { useToast } from '@/providers/ToastProvider';
import { ProfilePage } from '../components/ProfilePage';
import { spacing } from '@/design';
export default function HelpScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [expanded, setExpanded] = useState<number>();
  return (
    <ProfilePage title={t('profile.help')}>
      {[1, 2, 3, 4].map((id) => (
        <View key={id} style={{ gap: spacing[12] }}>
          <ListRow
            title={t(`profile.faq.${id}.question`)}
            accessibilityLabel={t(`profile.faq.${id}.question`)}
            onPress={() => setExpanded(expanded === id ? undefined : id)}
          />
          {expanded === id && <Text>{t(`profile.faq.${id}.answer`)}</Text>}
        </View>
      ))}
      <Button
        label={t('profile.contact')}
        onPress={() => {
          void Linking.openURL(`mailto:${env.EXPO_PUBLIC_SUPPORT_EMAIL}`).catch(
            () => toast(t('errors.generic')),
          );
        }}
      />
    </ProfilePage>
  );
}
