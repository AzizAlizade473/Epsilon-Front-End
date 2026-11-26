import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import { BirthDateField } from '@/components/ui/BirthDateField';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { bakuDay, noBillFilters, type BillFilters } from '@/hooks/billFilters';
import { dateOnly, parseBirthDate } from '@/lib/date-only';

const DATES = [
  ['any', 'bills.anyDate'],
  ['week', 'bills.week'],
  ['month', 'bills.month'],
  ['custom', 'bills.custom'],
] as const;

/** Filters in a bottom sheet; every choice applies to the list at once. */
export function BillFilterPanel({
  filters,
  onChange,
  onClose,
}: {
  filters: BillFilters;
  onChange: (filters: BillFilters) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [today] = useState(
    () => parseBirthDate(bakuDay(Date.now())) ?? new Date(),
  );
  const chooseDate = (date: BillFilters['date']) =>
    onChange({
      ...filters,
      date,
      // Opening the custom range starts from the last 30 days.
      ...(date === 'custom' && !filters.from
        ? { from: bakuDay(today.getTime(), 29), to: dateOnly(today) }
        : {}),
    });
  return (
    <Modal transparent visible onRequestClose={onClose}>
      <Sheet accessibilityLabel={t('bills.filters')} onClose={onClose}>
        <ScrollView
          style={{ maxHeight: height * 0.72 }}
          contentContainerStyle={styles.panel}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.head}>
            <Text variant="title2" accessibilityRole="header">
              {t('bills.filters')}
            </Text>
            <View>
              <Button
                variant="ghost"
                label={t('bills.reset')}
                onPress={() => onChange(noBillFilters)}
              />
            </View>
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>{t('bills.date')}</Text>
            <View
              style={styles.grid}
              accessibilityRole="radiogroup"
              accessibilityLabel={t('bills.date')}
            >
              {DATES.map(([value, label]) => {
                const checked = filters.date === value;
                return (
                  <PressSurface
                    key={value}
                    accessibilityRole="radio"
                    accessibilityLabel={t(label)}
                    accessibilityState={{ checked }}
                    onPress={() => chooseDate(value)}
                    spring
                    style={[styles.tile, checked && styles.tileOn]}
                    contentStyle={styles.tileContent}
                  >
                    <Text style={[styles.tileText, checked && styles.textOn]}>
                      {t(label)}
                    </Text>
                    {checked && (
                      <Animated.View
                        entering={FadeIn.duration(160).reduceMotion(
                          ReduceMotion.System,
                        )}
                      >
                        <Icon
                          icon={Check}
                          size="small"
                          color={colors.brand.primary}
                          decorative
                        />
                      </Animated.View>
                    )}
                  </PressSurface>
                );
              })}
            </View>
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
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>{t('bills.partner')}</Text>
            <SegmentedControl
              label={t('bills.partner')}
              value={filters.partner}
              onValueChange={(partner) => onChange({ ...filters, partner })}
              options={[
                { value: 'any', label: t('bills.any') },
                { value: 'yes', label: t('bills.partnerYes') },
                { value: 'no', label: t('bills.partnerNo') },
              ]}
            />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>{t('bills.cashback')}</Text>
            <SegmentedControl
              label={t('bills.cashback')}
              value={filters.cashback}
              onValueChange={(cashback) => onChange({ ...filters, cashback })}
              options={[
                { value: 'any', label: t('bills.any') },
                { value: 'eligible', label: t('bills.cashbackYes') },
                { value: 'none', label: t('bills.cashbackNo') },
              ]}
            />
          </View>
          <Button shape="rounded" label={t('bills.show')} onPress={onClose} />
        </ScrollView>
      </Sheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[20] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  group: { gap: spacing[8] },
  label: { ...o.type.product, color: o.colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius[16],
    borderWidth: layout.borderWidth,
    borderColor: o.colors.emptyStar,
    overflow: 'hidden',
  },
  tileOn: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.tint,
  },
  tileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
    minHeight: layout.controlHeight,
    paddingHorizontal: spacing[16],
  },
  tileText: { ...o.type.product, color: o.colors.ink, flexShrink: 1 },
  textOn: { color: colors.brand.primary },
});
