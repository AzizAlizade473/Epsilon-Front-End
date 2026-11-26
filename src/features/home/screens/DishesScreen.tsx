import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Utensils from 'lucide-react-native/icons/utensils';
import { BackButton } from '@/components/navigation/BackButton';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { spacing } from '@/design';
import {
  aspectSchema,
  type Aspect,
} from '@/services/contracts/restaurant-catalog';
import { DishTile, useDishTileWidth } from '../components/ExploreSection';
import {
  mentionCount,
  sortDishes,
  useAllDishes,
  type DishSort,
} from '../exploreFeed';

export default function DishesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useAllDishes();
  const width = useDishTileWidth();
  const [sort, setSort] = useState<DishSort>('top');
  const [aspect, setAspect] = useState<Aspect | null>(null);
  const items = useMemo(
    () => sortDishes(query.data ?? [], sort, aspect),
    [query.data, sort, aspect],
  );
  const showMentions = sort === 'mentioned' || aspect !== null;
  const header = (
    <View style={styles.header}>
      <SegmentedControl
        label={t('dishes.sortLabel')}
        options={[
          { value: 'top', label: t('dishes.sort.top') },
          { value: 'rated', label: t('dishes.sort.rated') },
          { value: 'mentioned', label: t('dishes.sort.mentioned') },
        ]}
        value={sort}
        onValueChange={setSort}
      />
      <View style={styles.chips}>
        {aspectSchema.options.map((value) => (
          <Chip
            key={value}
            tone="brand"
            label={t(`dining.aspect.${value}`)}
            selected={aspect === value}
            onPress={() => setAspect(aspect === value ? null : value)}
          />
        ))}
      </View>
      <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">
        {t('dishes.showing', { count: items.length })}
      </Text>
      {(sort !== 'top' || aspect !== null) && (
        <Button
          variant="ghost"
          label={t('dining.clearFilters')}
          onPress={() => {
            setSort('top');
            setAspect(null);
          }}
        />
      )}
    </View>
  );
  return (
    <Screen
      title={t('dishes.title')}
      scroll={false}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
        />
      }
    >
      <FlashList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.key}
        extraData={`${sort}/${aspect}`}
        maintainVisibleContentPosition={{ disabled: true }}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <DishTile
              entry={item}
              width={width}
              {...(showMentions
                ? {
                    note: t('dishes.mentions', {
                      count: mentionCount(item, aspect),
                    }),
                  }
                : {})}
            />
          </View>
        )}
        ListEmptyComponent={
          query.isPending ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={t('common.loading')}
            >
              <DetailRowSkeleton />
            </View>
          ) : query.isError ? (
            <ErrorState
              title={t('product.loadError')}
              retryLabel={t('common.retry')}
              onRetry={() => {
                void query.refetch();
              }}
            />
          ) : (
            <EmptyState
              icon={Utensils}
              title={t(aspect ? 'dining.noMatches' : 'dishes.empty')}
            />
          )
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { gap: spacing[12], paddingBottom: spacing[16] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  cell: { flex: 1, alignItems: 'center', paddingBottom: spacing[12] },
});
