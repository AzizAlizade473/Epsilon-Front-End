import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Star from 'lucide-react-native/icons/star';
import Timer from 'lucide-react-native/icons/timer';
import Weight from 'lucide-react-native/icons/weight';
import Flame from 'lucide-react-native/icons/flame';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Beef from 'lucide-react-native/icons/beef';
import Ham from 'lucide-react-native/icons/ham';
import Drumstick from 'lucide-react-native/icons/drumstick';
import Fish from 'lucide-react-native/icons/fish';
import Shrimp from 'lucide-react-native/icons/shrimp';
import CookingPot from 'lucide-react-native/icons/cooking-pot';
import Wheat from 'lucide-react-native/icons/wheat';
import Croissant from 'lucide-react-native/icons/croissant';
import Milk from 'lucide-react-native/icons/milk';
import Egg from 'lucide-react-native/icons/egg';
import Carrot from 'lucide-react-native/icons/carrot';
import Leaf from 'lucide-react-native/icons/leaf';
import Sprout from 'lucide-react-native/icons/sprout';
import Cherry from 'lucide-react-native/icons/cherry';
import Droplet from 'lucide-react-native/icons/droplet';
import Apple from 'lucide-react-native/icons/apple';
import Cookie from 'lucide-react-native/icons/cookie';
import Coffee from 'lucide-react-native/icons/coffee';
import Citrus from 'lucide-react-native/icons/citrus';
import Nut from 'lucide-react-native/icons/nut';
import Bean from 'lucide-react-native/icons/bean';
import Sandwich from 'lucide-react-native/icons/sandwich';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { LikeButton } from '@/components/likes/LikeButton';
import { dishLike, reviewLike } from '@/hooks/likeTargets';
import { useRestaurant } from '../hooks/useRestaurants';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { OfflineNotice, useOnline } from '@/components/feedback/OfflineNotice';
import { colors, layout, radius, spacing, typography } from '@/design';
import { premium } from '@/design/premium';
import { formatMoney } from '@/lib/money';
import { safeIdSchema } from '@/lib/deep-link';
import {
  aspectCounts,
  useCatalog,
  useDishReviews,
  type Aspect,
  type Ingredient,
} from '../catalog';
import { Hero, RoundButton } from '../components/Hero';
import { RatingBars, Stars } from '@/components/ratings/Ratings';
import { RatingTrend } from '../components/RatingTrend';
import { ReviewCard } from '@/components/ratings/ReviewCard';
import { Reveal } from '@/components/ratings/Reveal';

const ingredientIcons: Record<Ingredient, LucideIcon> = {
  beef: Beef,
  lamb: Ham,
  chicken: Drumstick,
  fish: Fish,
  shrimp: Shrimp,
  rice: CookingPot,
  pasta: Wheat,
  dough: Croissant,
  cheese: Milk,
  egg: Egg,
  vegetables: Carrot,
  herbs: Leaf,
  mushroom: Sprout,
  tomato: Cherry,
  sauce: Droplet,
  spice: Flame,
  fruit: Apple,
  chocolate: Cookie,
  coffee: Coffee,
  citrus: Citrus,
  nuts: Nut,
  yogurt: Milk,
  potato: Bean,
  bread: Sandwich,
};
const READ_MORE_AT = 140;

function Meta({ icon, label }: { icon?: LucideIcon; label: string }) {
  return (
    <View style={styles.meta}>
      {icon && (
        <Icon icon={icon} size="small" color={colors.brand.accent} decorative />
      )}
      <Text variant="callout">{label}</Text>
    </View>
  );
}

export default function PublicDishScreen() {
  const { id, dishId } = useLocalSearchParams<{ id: string; dishId: string }>();
  const valid =
    safeIdSchema.safeParse(id).success &&
    safeIdSchema.safeParse(dishId).success;
  const catalog = useCatalog(valid ? id : '');
  const reviews = useDishReviews(valid ? id : '', valid ? dishId : '');
  const restaurant = useRestaurant(valid ? id : '');
  const dish = catalog.data?.dishes.find((d) => d.id === dishId);
  const router = useRouter();
  const { t } = useTranslation();
  const online = useOnline();
  const [expanded, setExpanded] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const openReviews = (filter: { stars?: number; aspect?: Aspect } = {}) =>
    router.push({
      pathname: '/restaurant/[id]/dish/[dishId]/reviews',
      params: {
        id,
        dishId,
        ...(filter.stars ? { stars: String(filter.stars) } : {}),
        ...(filter.aspect ? { aspect: filter.aspect } : {}),
      },
    });
  const back = (
    <RoundButton
      icon={ArrowLeft}
      label={t('navigation.back')}
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace('/restaurants')
      }
    />
  );
  const heart = dish && (
    <LikeButton
      variant="overlay"
      target={dishLike(
        id,
        dish.id,
        dish.name,
        restaurant.data?.name ?? '',
        dish.imageUrl,
      )}
    />
  );
  const longText = (dish?.description.length ?? 0) > READ_MORE_AT;
  const mentions = aspectCounts(reviews.data ?? []).slice(0, 4);
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.column}
      >
        <Hero
          uri={dish?.imageUrl}
          height={premium.dishHero}
          scrollY={scrollY}
          leading={back}
          trailing={heart}
        />
        <View style={styles.sheet}>
          <OfflineNotice saved={Boolean(dish)} />
          {!dish ? (
            !online && !catalog.data ? null : catalog.isLoading ? (
              <View
                style={styles.section}
                accessibilityLabel={t('common.loading')}
              >
                <Skeleton width="70%" height={typography.title1.lineHeight} />
                <Skeleton width="100%" height={premium.trendHeight} />
              </View>
            ) : catalog.isError ? (
              <ErrorState
                title={t('product.loadError')}
                retryLabel={t('common.retry')}
                onRetry={() => void catalog.refetch()}
              />
            ) : (
              <Text accessibilityRole="alert">
                {t(catalog.data ? 'likes.gone' : 'premium.menuUnavailable')}
              </Text>
            )
          ) : (
            <>
              <Reveal order={0} style={styles.section}>
                <View style={styles.titleRow}>
                  <Text
                    variant="title1"
                    accessibilityRole="header"
                    style={styles.title}
                  >
                    {dish.name}
                  </Text>
                  <View style={styles.titleScore}>
                    <Star
                      size={spacing[20]}
                      color={colors.brand.accent}
                      fill={colors.brand.accent}
                      strokeWidth={layout.iconStrokeWidth}
                    />
                    <Text variant="headline">
                      {dish.rating.average.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text tone="secondary" numberOfLines={expanded ? undefined : 3}>
                  {dish.description}
                </Text>
                {longText && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() => setExpanded((v) => !v)}
                    hitSlop={spacing[12]}
                    style={styles.more}
                  >
                    <Text variant="callout" style={styles.link}>
                      {t(expanded ? 'dining.readLess' : 'dining.readMore')}
                    </Text>
                  </Pressable>
                )}
                <View style={styles.metaRow}>
                  {dish.priceMinor !== null && (
                    <View style={[styles.meta, styles.price]}>
                      <Text variant="headline" tone="inverse">
                        {formatMoney(dish.priceMinor)}
                      </Text>
                    </View>
                  )}
                  {dish.portionGrams && (
                    <Meta
                      icon={Weight}
                      label={t('dining.portion', { grams: dish.portionGrams })}
                    />
                  )}
                  <Meta
                    icon={Timer}
                    label={t('dining.prep', { minutes: dish.prepMinutes })}
                  />
                  {dish.spicy && (
                    <Meta icon={Flame} label={t('dining.spicy')} />
                  )}
                </View>
              </Reveal>
              {dish.ingredients.length > 0 && (
                <Reveal order={1} style={styles.section}>
                  <Text variant="title2" accessibilityRole="header">
                    {t('dining.ingredients')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.rail}
                    contentContainerStyle={styles.railContent}
                  >
                    {dish.ingredients.map((i) => (
                      <View key={i} style={styles.tile}>
                        <Icon
                          icon={ingredientIcons[i]}
                          color={colors.brand.primary}
                          decorative
                        />
                        <Text
                          variant="caption"
                          numberOfLines={2}
                          style={styles.tileText}
                        >
                          {t(`dining.ingredient.${i}`)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </Reveal>
              )}
              <Reveal order={2} style={styles.section}>
                <Text variant="title2" accessibilityRole="header">
                  {t('dining.allergens')}
                </Text>
                <View style={styles.tags}>
                  {dish.allergens.length ? (
                    dish.allergens.map((a) => (
                      <View key={a} style={styles.tag}>
                        <Text variant="caption">
                          {t(`dining.allergen.${a}`)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text variant="caption" tone="secondary">
                      {t('dining.noAllergens')}
                    </Text>
                  )}
                </View>
              </Reveal>
              <Reveal order={4} style={styles.section}>
                <Text variant="title2" accessibilityRole="header">
                  {t('dining.feedback')}
                </Text>
                <View style={styles.summary}>
                  <View style={styles.big}>
                    <Text style={styles.score}>
                      {dish.rating.average.toFixed(1)}
                    </Text>
                    <Stars value={dish.rating.average} />
                    <Text
                      variant="caption"
                      tone="secondary"
                      style={styles.center}
                    >
                      {t('dining.ratings', { count: dish.rating.count })}
                    </Text>
                  </View>
                  <RatingBars
                    rating={dish.rating}
                    onSelect={(stars) => openReviews({ stars })}
                  />
                </View>
                <View style={styles.panel}>
                  <RatingTrend trend={dish.trend} />
                </View>
                {mentions.length > 0 && (
                  <View style={styles.block}>
                    <Text variant="headline">{t('dining.mentions')}</Text>
                    <View style={styles.tags}>
                      {mentions.map(([aspect, count]) => (
                        <Chip
                          key={aspect}
                          tone="brand"
                          label={`${t(`dining.aspect.${aspect}`)} · ${count}`}
                          onPress={() => openReviews({ aspect })}
                        />
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.notice}>
                  <Icon
                    icon={ShieldCheck}
                    size="small"
                    color={colors.brand.accent}
                    decorative
                  />
                  <Text variant="caption" style={styles.noticeText}>
                    {t('dining.verifiedOnly')}
                  </Text>
                </View>
                {reviews.isLoading ? (
                  <Skeleton
                    width="100%"
                    height={premium.trendHeight}
                    accessibilityLabel={t('common.loading')}
                  />
                ) : reviews.isError ? (
                  <ErrorState
                    title={t('product.loadError')}
                    retryLabel={t('common.retry')}
                    onRetry={() => void reviews.refetch()}
                  />
                ) : reviews.data?.length ? (
                  <>
                    {reviews.data.slice(0, 3).map((r) => (
                      <ReviewCard
                        key={r.id}
                        review={r}
                        like={reviewLike(
                          id,
                          dish.id,
                          r.id,
                          dish.name,
                          r.comment,
                          dish.imageUrl,
                        )}
                        tagKeys={r.aspects.map((a) => `dining.aspect.${a}`)}
                        lines={4}
                      />
                    ))}
                    <Button
                      variant="secondary"
                      label={t('dining.seeAll', {
                        count: reviews.data.length,
                      })}
                      onPress={() => openReviews()}
                    />
                  </>
                ) : (
                  <Text tone="secondary">{t('dining.noReviews')}</Text>
                )}
              </Reveal>
            </>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  column: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingBottom: spacing[48],
  },
  sheet: {
    marginTop: -premium.sheetOverlap,
    borderTopLeftRadius: premium.sheetRadius,
    borderTopRightRadius: premium.sheetRadius,
    backgroundColor: colors.surface,
    paddingTop: spacing[24],
    paddingHorizontal: spacing.screenMargin,
    gap: spacing[32],
  },
  section: { gap: spacing[12] },
  block: { gap: spacing[8] },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  title: { flex: 1, color: colors.brand.primary },
  titleScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingTop: spacing[8],
  },
  more: { alignSelf: 'flex-start', minHeight: layout.tapTarget / 1.5 },
  link: { color: colors.brand.secondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    minHeight: spacing[32] + spacing[4],
    paddingHorizontal: spacing[12],
    borderRadius: radius.pill,
    backgroundColor: premium.canvas,
  },
  price: { backgroundColor: colors.brand.primary },
  rail: { marginHorizontal: -spacing.screenMargin },
  railContent: { gap: spacing[12], paddingHorizontal: spacing.screenMargin },
  tile: {
    width: premium.tile,
    minHeight: premium.tile,
    padding: spacing[8],
    gap: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[20],
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
  },
  tileText: { textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  tag: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radius[12],
    backgroundColor: colors.divider,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[20],
    padding: spacing[16],
    borderRadius: radius[20],
    backgroundColor: premium.canvas,
  },
  big: { alignItems: 'center', gap: spacing[4], maxWidth: '40%' },
  score: { ...typography.display, color: colors.brand.primary },
  center: { textAlign: 'center' },
  panel: {
    padding: spacing[16],
    borderRadius: radius[20],
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  noticeText: { flex: 1, color: colors.brand.accent },
});
