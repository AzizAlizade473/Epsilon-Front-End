import { useTranslation } from 'react-i18next';
import Mail from 'lucide-react-native/icons/mail';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { View } from 'react-native';
import { colors } from '@/design';
import { AUTH_LEADING_WIDTH } from './PhoneField';

/** Where the login code is e-mailed while codes go by e-mail instead of SMS. */
export function EmailField({
  value,
  onChange,
  disabled,
  error,
  onSubmit,
  appearance = 'boxed',
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  onSubmit: () => void;
  appearance?: 'boxed' | 'underline';
}) {
  const { t } = useTranslation();
  return (
    <Input
      label={t('auth.emailLabel')}
      hint={t('auth.emailHelp')}
      value={value}
      onChangeText={onChange}
      error={error}
      editable={!disabled}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      maxLength={254}
      onSubmitEditing={onSubmit}
      returnKeyType="send"
      appearance={appearance}
      leading={
        <View style={{ width: AUTH_LEADING_WIDTH }}>
          <Icon
            icon={Mail}
            size="small"
            color={colors.inkSecondary}
            decorative
          />
        </View>
      }
    />
  );
}
