import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Smartphone from 'lucide-react-native/icons/smartphone';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing, typography } from '@/design';
import { formatPhone } from '../schemas';

/** Phone and e-mail share one leading column, so both inputs start at the same x. */
export const AUTH_LEADING_WIDTH = 92;

export function PhoneField({
  value,
  onChange,
  disabled,
  error,
  onSubmit,
  autoFocus = true,
  appearance = 'boxed',
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  onSubmit: () => void;
  autoFocus?: boolean;
  appearance?: 'boxed' | 'underline';
}) {
  const { t } = useTranslation();
  const input = (
    <Input
      label={t('auth.phoneLabel')}
      value={value}
      onChangeText={(text) => onChange(formatPhone(text))}
      error={error}
      editable={!disabled}
      keyboardType="phone-pad"
      autoFocus={autoFocus}
      autoComplete="tel-national"
      textContentType="telephoneNumber"
      onSubmitEditing={onSubmit}
      returnKeyType="send"
      appearance={appearance}
      leading={
        <View style={styles.leading}>
          <Icon
            icon={Smartphone}
            size="small"
            color={colors.inkSecondary}
            decorative
          />
          <Text accessibilityLabel={t('auth.countryCode')}>+994</Text>
          <View style={styles.rule} />
        </View>
      }
    />
  );
  if (appearance === 'underline') return input;
  return (
    <View style={styles.row}>
      <View style={styles.prefix}>
        <Text accessibilityLabel={t('auth.countryCode')}>+994</Text>
      </View>
      <View style={styles.field}>{input}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12] },
  prefix: {
    minHeight: layout.controlHeight,
    marginTop: typography.callout.lineHeight + spacing[8],
    justifyContent: 'center',
    paddingHorizontal: spacing[12],
    backgroundColor: colors.background,
    borderRadius: radius[16],
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
  },
  field: { flex: 1, minWidth: 0 },
  leading: {
    width: AUTH_LEADING_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  rule: {
    width: layout.borderWidth,
    height: spacing[20],
    backgroundColor: colors.brand.border,
  },
});
