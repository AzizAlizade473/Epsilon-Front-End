import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { BirthDateField } from '@/components/ui/BirthDateField';
import { dateOnly, parseBirthDate } from '@/lib/date-only';
import { bakuDay, type BillFilters } from '@/hooks/billFilters';

function Group<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.group}>
      <Text variant="caption" accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.chips}>
        {options.map(([option, label]) => (
          <Chip
            key={option}
            tone="brand"
            label={label}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

export function BillFilterPanel({
  filters,
  onChange,
}: {
  filters: BillFilters;
  onChange: (filters: BillFilters) => void;
}) {
  const { t } = useTranslation();
  const [today] = useState(
    () => parseBirthDate(bakuDay(Date.now())) ?? new Date(),
  );
  return (
    <View style={styles.panel}>
      <Group
        title={t('bills.date')}
        value={filters.date}
        options={[
          ['any', t('bills.anyDate')],
          ['week', t('bills.week')],
          ['month', t('bills.month')],
          ['custom', t('bills.custom')],
        ]}
        onChange={(date) =>
          onChange({
            ...filters,
            date,
            // Opening the custom range starts from the last 30 days.
            ...(date === 'custom' && !filters.from
              ? { from: bakuDay(Date.now(), 29), to: dateOnly(today) }
              : {}),
          })
        }
      />
      {filters.date === 'custom' &&
        (['from', 'to'] as const).map((edge) => (
          <BirthDateField
            key={edge}
            label={t(`bills.${edge}`)}
            value={filters[edge]}
            maximumDate={today}
            onChange={(value) => onChange({ ...filters, [edge]: value })}
          />
        ))}
      <Group
        title={t('bills.partner')}
        value={filters.partner}
        options={[
          ['any', t('bills.any')],
          ['yes', t('bills.partnerYes')],
          ['no', t('bills.partnerNo')],
        ]}
        onChange={(partner) => onChange({ ...filters, partner })}
      />
      <Group
        title={t('bills.cashback')}
        value={filters.cashback}
        options={[
          ['any', t('bills.any')],
          ['eligible', t('bills.cashbackYes')],
          ['none', t('bills.cashbackNo')],
        ]}
        onChange={(cashback) => onChange({ ...filters, cashback })}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { gap: spacing[12], paddingBottom: spacing[16] },
  group: { gap: spacing[8] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
});
