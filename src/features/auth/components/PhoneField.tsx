import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing, typography } from '@/design';
import { formatPhone } from '../schemas';

export function PhoneField({
  value,
  onChange,
  disabled,
  error,
  onSubmit,
  autoFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  onSubmit: () => void;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.prefix}>
        <Text accessibilityLabel={t('auth.countryCode')}>+994</Text>
      </View>
      <View style={styles.field}>
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
        />
      </View>
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
});
