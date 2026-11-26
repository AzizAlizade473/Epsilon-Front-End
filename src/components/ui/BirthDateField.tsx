import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { dateOnly, parseBirthDate } from '@/lib/date-only';
const DateTimePicker = lazy(
  () => import('@react-native-community/datetimepicker'),
);

export function BirthDateField({
  value,
  onChange,
  maximumDate,
  error,
  disabled,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  maximumDate: Date;
  error?: string;
  disabled?: boolean;
  /** Other date inputs reuse this field under their own name. */
  label?: string;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const date = parseBirthDate(value) ?? maximumDate;
  const display = date.toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const name = label ?? t('onboarding.birthDate');
  return (
    <View style={styles.group}>
      <Text variant="callout">{name}</Text>
      <PressSurface
        accessibilityLabel={`${name}: ${display}`}
        disabled={disabled}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={styles.field}
        contentStyle={styles.content}
      >
        <Text>{display}</Text>
      </PressSurface>
      {error && (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
      {open && (
        <>
          <Suspense fallback={<Text>{t('common.loading')}</Text>}>
            <DateTimePicker
              value={date}
              mode="date"
              maximumDate={maximumDate}
              display="default"
              onChange={(event, selected) => {
                if (Platform.OS === 'android') setOpen(false);
                if (event.type === 'set' && selected)
                  onChange(dateOnly(selected));
              }}
            />
          </Suspense>
          {Platform.OS === 'ios' && (
            <Button
              variant="ghost"
              label={t('common.confirm')}
              onPress={() => setOpen(false)}
            />
          )}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: spacing[8] },
  field: {
    borderRadius: radius[16],
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  content: {
    minHeight: layout.controlHeight,
    alignItems: 'flex-start',
    padding: spacing[16],
  },
});
