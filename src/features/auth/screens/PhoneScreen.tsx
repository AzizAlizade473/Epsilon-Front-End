import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { AuthHeading } from '@/components/ui/AuthHeading';
import { Brand } from '@/components/ui/Brand';
import Smartphone from 'lucide-react-native/icons/smartphone';
import { PhoneField } from '../components/PhoneField';
import { usePhoneEntry } from '../hooks/usePhoneEntry';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const entry = usePhoneEntry();
  return (
    <Screen
      surface="surface"
      trailing={<Brand />}
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
      <AuthHeading
        icon={Smartphone}
        title={t('navigation.phone')}
        message={t('auth.phoneHelper')}
      />
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
