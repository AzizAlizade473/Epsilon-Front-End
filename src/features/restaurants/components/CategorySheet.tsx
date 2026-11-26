import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import type { DirectoryEntry } from '@/services/contracts/restaurant-catalog';
import {
  activeCount,
  facets,
  matches,
  noFilters,
  toggle,
  type FilterGroup,
  type Filters,
} from '../discovery';

export function CategorySheet({
  entries,
  filters,
  onChange,
  onClose,
}: {
  entries: readonly DirectoryEntry[];
  filters: Filters;
  onChange: (next: Filters) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const label = (group: FilterGroup, value: string) =>
    group === 'cuisine'
      ? t(`dining.cuisine.${value}`)
      : group === 'ingredient'
        ? t(`dining.ingredient.${value}`)
        : group === 'price'
          ? '₼'.repeat(Number(value))
          : value;
  const shown = entries.filter((entry) => matches(entry, filters)).length;
  return (
    <Modal transparent visible onRequestClose={onClose}>
      <Sheet onClose={onClose} accessibilityLabel={t('discovery.all')}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          <Text variant="title2" accessibilityRole="header">
            {t('discovery.all')}
          </Text>
          {facets(entries, filters).map(({ group, options }) =>
            options.length ? (
              <View key={group} style={styles.group}>
                <Text variant="headline" accessibilityRole="header">
                  {t(`discovery.group.${group}`)}
                </Text>
                <View style={styles.options}>
                  {options.map(({ value, count }) => (
                    <Chip
                      key={value}
                      label={`${label(group, value)} · ${count}`}
                      tone="brand"
                      selected={filters[group].includes(value)}
                      onPress={() => onChange(toggle(filters, group, value))}
                    />
                  ))}
                </View>
              </View>
            ) : null,
          )}
          {!entries.length && (
            <Text tone="secondary">{t('discovery.none')}</Text>
          )}
        </ScrollView>
        <View style={styles.actions}>
          <Button
            label={t('discovery.show', { count: shown })}
            onPress={onClose}
          />
          <Button
            variant="ghost"
            label={t('discovery.clear')}
            disabled={!activeCount(filters)}
            onPress={() => onChange(noFilters)}
          />
        </View>
      </Sheet>
    </Modal>
  );
}
const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  body: { gap: spacing[20], paddingBottom: spacing[16] },
  group: { gap: spacing[8] },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  actions: { gap: spacing[8] },
});
