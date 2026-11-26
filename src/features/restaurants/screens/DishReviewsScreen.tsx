import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import MessageSquare from 'lucide-react-native/icons/message-square';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { colors, layout, radius, spacing, typography } from '@/design';
import { premium } from '@/design/premium';
import { safeIdSchema } from '@/lib/deep-link';
import {
  aspectCounts,
  filterReviews,
  useCatalog,
  useDishReviews,
  type Aspect,
  type Review,
  type ReviewSort,
} from '../catalog';
import { RatingBars, Stars } from '@/components/ratings/Ratings';
import { ReviewCard } from '@/components/ratings/ReviewCard';
import { reviewLike } from '@/hooks/likeTargets';
import { aspectSchema } from '@/services/contracts/restaurant-catalog';
import { Reveal } from '@/components/ratings/Reveal';

type Params = {
  id: string;
  dishId: string;
  stars?: string;
  aspect?: string;
  /** A liked review to show first. */
  review?: string;
};

export default function DishReviewsScreen() {
  const params = useLocalSearchParams<Params>();
  // A reused screen with new params starts clean: no filter survives navigation.
  const key = [
    params.id,
    params.dishId,
    params.stars,
    params.aspect,
    params.review,
  ].join('/');
  return <Reviews key={key} params={params} />;
}

function Reviews({ params }: { params: Params }) {
  const { id, dishId } = params;
  const valid =
    safeIdSchema.safeParse(id).success &&
    safeIdSchema.safeParse(dishId).success;
  const initialStars = Number(params.stars);
  const { t } = useTranslation();
  const router = useRouter();
  const catalog = useCatalog(valid ? id : '');
  const reviews = useDishReviews(valid ? id : '', valid ? dishId : '');
  const dish = catalog.data?.dishes.find((d) => d.id === dishId);
  const [stars, setStars] = useState<number | null>(
    Number.isInteger(initialStars) && initialStars >= 1 && initialStars <= 5
      ? initialStars
      : null,
  );
  const [aspect, setAspect] = useState<Aspect | null>(
    aspectSchema.safeParse(params.aspect).data ?? null,
  );
  const [sort, setSort] = useState<ReviewSort>('newest');
  const all = reviews.data;
  const items = useMemo(() => {
    const kept = filterReviews(all ?? [], { stars, aspect, sort });
    const focus = kept.findIndex((r) => r.id === params.review);
    if (focus > 0) kept.unshift(...kept.splice(focus, 1));
    return kept;
  }, [all, stars, aspect, sort, params.review]);
  // Each count answers "how many would I see?": the other filter stays applied.
  const aspects = useMemo(() => {
    const counted = aspectCounts(
      filterReviews(all ?? [], { stars, aspect: null, sort: 'newest' }),
    );
    if (aspect && !counted.some(([a]) => a === aspect))
      counted.push([aspect, 0]);
    return counted;
  }, [all, stars, aspect]);
  const starCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const r of filterReviews(all ?? [], {
      stars: null,
      aspect,
      sort: 'newest',
    }))
      counts[r.rating]! += 1;
    return counts;
  }, [all, aspect]);
  const clearFilters = () => {
    setStars(null);
    setAspect(null);
  };
  const reset = () => {
    clearFilters();
    setSort('newest');
  };
  const gone = Boolean(
    params.review && all && !all.some((r) => r.id === params.review),
  );
  const renderItem = ({ item, index }: ListRenderItemInfo<Review>) => (
    <Reveal order={index} style={styles.item}>
      <ReviewCard
        review={item}
        tagKeys={item.aspects.map((a) => `dining.aspect.${a}`)}
        like={reviewLike(
          id,
          dishId,
          item.id,
          dish?.name ?? t('dining.reviewsTitle'),
          item.comment,
          dish?.imageUrl,
        )}
      />
    </Reveal>
  );
  const header = (
    <View style={styles.header}>
      {dish && (
        <View style={styles.summary}>
          <View style={styles.big}>
            <Text style={styles.score}>{dish.rating.average.toFixed(1)}</Text>
            <Stars value={dish.rating.average} />
            <Text variant="caption" tone="secondary" style={styles.center}>
              {t('dining.ratings', { count: dish.rating.count })}
            </Text>
          </View>
          <RatingBars
            rating={dish.rating}
            selected={stars}
            onSelect={(s) => setStars(stars === s ? null : s)}
          />
        </View>
      )}
      <SegmentedControl
        label={t('dining.sortLabel')}
        options={[
          { value: 'newest', label: t('dining.sort.newest') },
          { value: 'highest', label: t('dining.sort.highest') },
          { value: 'lowest', label: t('dining.sort.lowest') },
        ]}
        value={sort}
        onValueChange={setSort}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rail}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label={t('dining.filterAll', { count: all?.length ?? 0 })}
          tone="brand"
          selected={stars === null && aspect === null}
          onPress={clearFilters}
        />
        {[5, 4, 3, 2, 1].map((s) => (
          <Chip
            key={s}
            label={t('dining.starFilter', { stars: s, count: starCounts[s] })}
            tone="brand"
            selected={stars === s}
            disabled={!starCounts[s] && stars !== s}
            onPress={() => setStars(stars === s ? null : s)}
          />
        ))}
      </ScrollView>
      {aspects.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.chips}
        >
          {aspects.map(([a, count]) => (
            <Chip
              key={a}
              label={`${t(`dining.aspect.${a}`)} · ${count}`}
              selected={aspect === a}
              onPress={() => setAspect(aspect === a ? null : a)}
            />
          ))}
        </ScrollView>
      )}
      {gone && <Text accessibilityRole="alert">{t('likes.gone')}</Text>}
      <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">
        {t('dining.showing', { count: items.length })}
      </Text>
      {(stars !== null || aspect !== null || sort !== 'newest') && (
        <Button
          variant="ghost"
          label={t('dining.clearFilters')}
          onPress={reset}
        />
      )}
    </View>
  );
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <Header
        title={dish ? dish.name : t('dining.reviewsTitle')}
        leading={
          <IconButton
            icon={ArrowLeft}
            accessibilityLabel={t('navigation.back')}
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/restaurants')
            }
          />
        }
      />
      <View style={styles.column}>
        <FlashList
          data={reviews.isSuccess ? items : []}
          renderItem={renderItem}
          maintainVisibleContentPosition={{ disabled: true }}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            reviews.isLoading || catalog.isLoading ? (
              <View
                accessibilityLabel={t('common.loading')}
                accessibilityRole="progressbar"
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <DetailRowSkeleton key={i} />
                ))}
              </View>
            ) : reviews.isError || !valid ? (
              <ErrorState
                title={t('product.loadError')}
                retryLabel={t('common.retry')}
                onRetry={() => void reviews.refetch()}
              />
            ) : all?.length ? (
              <View style={styles.empty}>
                <Text tone="secondary">{t('dining.noMatches')}</Text>
              </View>
            ) : (
              <EmptyState icon={MessageSquare} title={t('dining.noReviews')} />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: premium.canvas },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  list: { paddingHorizontal: spacing.screenMargin, paddingBottom: spacing[48] },
  header: { gap: spacing[16], paddingVertical: spacing[16] },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[20],
    padding: spacing[16],
    borderRadius: radius[20],
    backgroundColor: colors.surface,
  },
  big: { alignItems: 'center', gap: spacing[4], maxWidth: '40%' },
  score: { ...typography.display, color: colors.brand.primary },
  center: { textAlign: 'center' },
  rail: { marginHorizontal: -spacing.screenMargin },
  chips: { gap: spacing[8], paddingHorizontal: spacing.screenMargin },
  item: { marginBottom: spacing[12] },
  empty: {
    alignItems: 'center',
    gap: spacing[8],
    paddingVertical: spacing[32],
  },
});
