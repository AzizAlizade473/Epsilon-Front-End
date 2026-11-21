import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ContourPattern } from '@/components/ui/ContourPattern';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { ScoreLine } from '@/components/ratings/Ratings';
import { colors, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import type { RetailCategory, ShelfItem, Supermarket } from '../retail';
import { Image } from 'expo-image';
import { ProductImage } from './ProductImage';

/** Store identity: official logo on a tile over its photo or contour header. */
export function StoreBanner({
  store,
  height,
  overlap = 0,
  children,
}: {
  store: Supermarket;
  height: number;
  /** Height hidden under a sheet below, so the monogram stays visible. */
  overlap?: number;
  children?: React.ReactNode;
}) {
  // Capitals give FreshMart → FM, City Market → CM.
  const initials = (store.name.match(/\p{Lu}/gu) ?? [store.name[0]])
    .slice(0, 2)
    .join('');
  return (
    <View style={[styles.banner, { height, backgroundColor: store.color }]}>
      {store.coverUrl ? (
        <>
          <Image
            source={{ uri: store.coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessible={false}
          />
          <View style={styles.scrim} />
        </>
      ) : (
        <ContourPattern color={colors.surface} opacity={0.12} />
      )}
      <View
        style={[
          styles.monogram,
          store.logoUrl && styles.logoTile,
          store.logoUrl && store.logoOnDark && { backgroundColor: store.color },
          { bottom: spacing[16] + overlap },
        ]}
        accessible
        accessibilityLabel={store.name}
      >
        {store.logoUrl ? (
          <Image
            source={{ uri: store.logoUrl }}
            style={styles.logo}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessible={false}
          />
        ) : (
          <Text variant="headline" style={{ color: store.color }}>
            {initials}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

export const SupermarketCard = memo(function SupermarketCard({
  store,
  productCount,
  categories,
  onPress,
}: {
  store: Supermarket;
  productCount: number;
  categories: RetailCategory[];
  onPress: (id: string) => void;
}) {
  const { t } = useTranslation();
  const count = t('retail.productCount', { count: productCount });
  return (
    <PressSurface
      accessibilityLabel={`${store.name}, ${count}`}
      onPress={() => onPress(store.id)}
      style={styles.card}
      contentStyle={styles.cardContent}
      spring
    >
      <StoreBanner store={store} height={premium.storeBanner}></StoreBanner>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text variant="title2" numberOfLines={1} style={styles.flex}>
            {store.name}
          </Text>
          <Text variant="caption" tone="secondary">
            {count}
          </Text>
        </View>
        <Text tone="secondary" numberOfLines={2}>
          {store.description}
        </Text>
        <View style={styles.tags}>
          {categories.slice(0, 4).map((c) => (
            <View key={c} style={styles.tag}>
              <Text variant="caption" style={styles.tagText}>
                {t(`retail.category.${c}`)}
              </Text>
            </View>
          ))}
          {categories.length > 4 && (
            <Text variant="caption" tone="secondary">
              {`+${categories.length - 4}`}
            </Text>
          )}
        </View>
      </View>
    </PressSurface>
  );
});

export const ProductRow = memo(function ProductRow({
  item,
  onPress,
}: {
  item: ShelfItem;
  onPress: (productId: string) => void;
}) {
  const { t } = useTranslation();
  const { product, summary } = item;
  return (
    <PressSurface
      accessibilityLabel={[
        product.brand,
        product.name,
        product.size,
        summary.count
          ? t('dining.scoreLabel', { score: summary.average.toFixed(1) })
          : t('retail.noRatings'),
      ].join(', ')}
      onPress={() => onPress(product.id)}
      contentStyle={styles.row}
      pressedColor={colors.divider}
    >
      <ProductImage product={product} size={premium.rowThumb + spacing[24]} />
      <View style={styles.rowCopy}>
        {product.brand !== '—' && (
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <Text variant="headline" numberOfLines={2}>
          {product.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {`${product.size} · ${t(`retail.category.${product.category}`)}`}
        </Text>
        {summary.count > 0 ? (
          <ScoreLine rating={summary} />
        ) : (
          <Text variant="caption" tone="secondary">
            {t('retail.noRatings')}
          </Text>
        )}
      </View>
    </PressSurface>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  banner: { overflow: 'hidden', justifyContent: 'flex-end' },
  monogram: {
    position: 'absolute',
    left: spacing[16],
    bottom: spacing[16],
    width: spacing[48],
    height: spacing[48],
    borderRadius: radius[16],
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTile: {
    width: spacing[48] * 2 + spacing[8],
    paddingHorizontal: spacing[8],
    borderWidth: 1,
    borderColor: colors.divider,
  },
  logo: { width: '100%', height: spacing[32] },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: premium.scrim,
  },
  badgeSlot: { position: 'absolute', top: spacing[12], right: spacing[12] },
  card: {
    ...premium.shadow,
    backgroundColor: colors.surface,
    borderRadius: radius[24],
    marginBottom: spacing[16],
    overflow: 'hidden',
  },
  cardContent: { alignItems: 'stretch', justifyContent: 'flex-start' },
  cardBody: { padding: spacing[16], gap: spacing[8] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[8],
  },
  tag: {
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: premium.canvas,
  },
  tagText: { color: colors.inkSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[16],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing.screenMargin,
    borderRadius: radius[16],
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
});
