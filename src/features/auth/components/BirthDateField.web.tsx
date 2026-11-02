import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';

/** Browser preview keeps the same validated ISO date; no native picker import. */
export function BirthDateField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  maximumDate: Date;
  error?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Input
      label={t('onboarding.birthDate')}
      value={value}
      editable={!disabled}
      error={error}
      hint={t('authFlow.birthDateFormat')}
      onChangeText={onChange}
      autoComplete="birthdate-full"
    />
  );
}
