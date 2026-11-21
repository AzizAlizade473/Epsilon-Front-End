import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { RatingBars, Stars } from '@/components/ratings/Ratings';
import { ReviewCard } from '@/components/ratings/ReviewCard';
import { Reveal } from '@/components/ratings/Reveal';
import { colors, layout, radius, spacing, typography } from '@/design';
import { premium } from '@/design/premium';
import { formatMoney } from '@/lib/money';
import { safeIdSchema } from '@/lib/deep-link';
import { attributeAverages, summarize, useRetailCatalog } from '../retail';
import { DemoRatingCard } from '../components/DemoRatingCard';
import { ProductImage } from '../components/ProductImage';

export default function ProductScreen() {
  const { id, productId } = useLocalSearchParams<{
    id: string;
    productId: string;
  }>();
  const valid =
    safeIdSchema.safeParse(id).success &&
    safeIdSchema.safeParse(productId).success;
  const { t } = useTranslation();
  const router = useRouter();
  const top = useSafeAreaInsets().top;
  const width = Math.min(useWindowDimensions().width, layout.contentMaxWidth);
  const catalog = useRetailCatalog();
  const data = valid ? catalog.data : null;
  const product = data?.products.find((p) => p.id === productId);
  const store = data?.supermarkets.find((s) => s.id === id);
  const listing = data?.listings.find(
    (l) => l.supermarketId === id && l.productId === productId,
  );
  const reviews = useMemo(
    () =>
      (data?.reviews ?? [])
        .filter((r) => r.productId === productId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [data, productId],
  );
  const summary = useMemo(() => summarize(reviews), [reviews]);
  const attributes = useMemo(
    () => (product ? attributeAverages(reviews, product.attributes) : []),
    [reviews, product],
  );
  const storeName = (sid: string) =>
    data?.supermarkets.find((s) => s.id === sid)?.name ?? '';
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/supermarket/[id]', params: { id } });
  if (!product) {
    return (
      <View style={[styles.root, { paddingTop: top + spacing[8] }]}>
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel={t('navigation.back')}
          onPress={goBack}
        />
        <View style={styles.pad}>
          {catalog.isPending ? (
            <DetailRowSkeleton />
          ) : catalog.isError ? (
            <ErrorState
              title={t('product.loadError')}
              retryLabel={t('common.retry')}
              onRetry={() => void catalog.refetch()}
            />
          ) : (
            <Text accessibilityRole="alert">{t('retail.productMissing')}</Text>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.column}>
        <View>
          <ProductImage product={product} size={width} rounded={false} />
          <View style={[styles.back, { top: top + spacing[8] }]}>
            <IconButton
              icon={ArrowLeft}
              accessibilityLabel={t('navigation.back')}
              onPress={goBack}
            />
          </View>
        </View>
        <View style={styles.sheet}>
          <Reveal order={0} style={styles.block}>
            <View style={styles.brandRow}>
              <Text variant="callout" style={styles.brand}>
                {product.brand === '—' ? '' : product.brand}
              </Text>
              <View style={styles.badges}>
                {product.privateLabel && (
                  <View style={styles.pl}>
                    <Text variant="caption" style={styles.plText}>
                      {t('retail.privateLabel')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text
              variant="title1"
              accessibilityRole="header"
              style={styles.title}
            >
              {product.name}
            </Text>
            <Text tone="secondary">
              {[
                product.variant,
                product.size,
                t(`retail.category.${product.category}`),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {store && (
              <View style={styles.meta}>
                <Text variant="callout">
                  {t('retail.atStore', { store: store.name })}
                </Text>
                {listing?.priceMinor != null && (
                  <Text variant="caption" tone="secondary">
                    {t('retail.samplePrice', {
                      price: formatMoney(listing.priceMinor),
                      date: product.sources[0]?.checkedOn ?? '',
                    })}
                  </Text>
                )}
              </View>
            )}
          </Reveal>
          <Reveal order={1} style={styles.block}>
            <Text variant="title2" accessibilityRole="header">
              {t('retail.ratingsTitle')}
            </Text>
            <Text variant="caption" tone="secondary">
              {t('retail.productLevel')}
            </Text>
            {summary.count > 0 ? (
              <>
                <View style={styles.summary}>
                  <View style={styles.big}>
                    <Text style={styles.score}>
                      {summary.average.toFixed(1)}
                    </Text>
                    <Stars value={summary.average} />
                    <Text
                      variant="caption"
                      tone="secondary"
                      style={styles.center}
                    >
                      {t('retail.sampleRatings', { count: summary.count })}
                    </Text>
                  </View>
                  <RatingBars rating={summary} />
                </View>
                <View style={styles.panel}>
                  {attributes.map(({ attribute, average }) => (
                    <View
                      key={attribute}
                      style={styles.attr}
                      accessible
                      accessibilityLabel={`${t(`retail.attribute.${attribute}`)}: ${average.toFixed(1)}`}
                    >
                      <Text variant="callout" style={styles.attrLabel}>
                        {t(`retail.attribute.${attribute}`)}
                      </Text>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            { width: `${(average / 5) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text variant="callout" style={styles.attrValue}>
                        {average.toFixed(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text tone="secondary">{t('retail.noRatings')}</Text>
            )}
          </Reveal>
          <View style={styles.notice}>
            <Icon
              icon={ShieldCheck}
              size="small"
              color={colors.brand.accent}
              decorative
            />
            <View style={styles.noticeCopy}>
              <Text variant="callout" style={styles.noticeTitle}>
                {t('retail.verifiedRequired')}
              </Text>
              <Text variant="caption" style={styles.noticeText}>
                {t('retail.verifiedRequiredBody')}
              </Text>
            </View>
          </View>
          <DemoRatingCard productId={product.id} />
          <View style={styles.block}>
            <Text variant="title2" accessibilityRole="header">
              {t('retail.reviewsTitle')}
            </Text>
            {reviews.map((r) => (
              <View key={r.id} style={styles.reviewWrap}>
                <ReviewCard
                  review={r}
                  sample={r.verification === 'sample'}
                  tagKeys={[]}
                />
                <Text variant="caption" tone="secondary" style={styles.from}>
                  {t('retail.reviewAt', { store: storeName(r.supermarketId) })}
                </Text>
              </View>
            ))}
          </View>
          {product.sources.length > 0 && (
            <Text variant="caption" style={styles.source}>
              {t('retail.sourceLine', {
                hosts: [
                  ...new Set(
                    product.sources.map((src) => new URL(src.url).hostname),
                  ),
                ].join(', '),
                date: product.sources[0]!.checkedOn,
              })}
            </Text>
          )}
        </View>
      </ScrollView>
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
  pad: { padding: spacing.screenMargin },
  back: {
    position: 'absolute',
    left: spacing[12],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
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
  block: { gap: spacing[12] },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  brand: { color: colors.brand.secondary, flexShrink: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  pl: {
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  plText: { color: colors.surface },
  source: { color: colors.inkMuted },
  title: { color: colors.brand.primary },
  meta: {
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: premium.canvas,
    gap: spacing[4],
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
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radius[20],
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
  },
  attr: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  attrLabel: { width: '34%' },
  attrValue: { minWidth: spacing[32], textAlign: 'right' },
  track: {
    flex: 1,
    height: premium.barHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.secondary,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  noticeCopy: { flex: 1, gap: spacing[4] },
  noticeTitle: { color: colors.brand.primary },
  noticeText: { color: colors.brand.accent },
  reviewWrap: { gap: spacing[4] },
  from: { paddingHorizontal: spacing[4] },
});
