import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { PhoneField } from '../components/PhoneField';
import { usePhoneEntry } from '../hooks/usePhoneEntry';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const entry = usePhoneEntry();
  return (
    <Screen
      title={t('navigation.phone')}
      leading={<BackButton />}
      footer={
        <Button
          label={t(entry.hasCode ? 'auth.enterCode' : 'auth.sendCode')}
          loading={entry.busy}
          disabled={entry.disabled}
          onPress={() => {
            void entry.submit();
          }}
        />
      }
    >
      <Text>{t('auth.phoneHelper')}</Text>
      <PhoneField
        value={entry.phone}
        disabled={entry.busy}
        onSubmit={() => {
          void entry.submit();
        }}
        onChange={entry.onChange}
        error={entry.error}
      />
    </Screen>
  );
}
