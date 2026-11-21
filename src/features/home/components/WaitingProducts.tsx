import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { FoodImage } from '@/components/food/FoodImage';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { useExplore } from '../exploreFeed';

/**
 * Sample supermarket products to try rating. No supermarket purchase can be
 * verified yet, so these are not pending receipts: each opens the product page's
 * try-it rating (kept on the device, no cashback).
 */
export function WaitingProducts() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = (useExplore().data?.products ?? []).slice(0, 4);
  return (
    <View style={styles.section}>
      <View style={styles.list}>
        {items.map((item) => (
          <PressSurface
            key={item.key}
            accessibilityLabel={t('home.rateProduct', { name: item.title })}
            onPress={() => {
              if (
                item.target.pathname !== '/supermarket/[id]/product/[productId]'
              )
                return;
              router.push({
                pathname: item.target.pathname,
                params: {
                  id: item.target.id,
                  productId: item.target.productId,
                },
              });
            }}
            contentStyle={styles.card}
            spring
          >
            <FoodImage
              uri={item.imageUrl}
              width={premium.rowThumb}
              height={premium.rowThumb}
            />
            <View style={styles.copy}>
              <Text variant="headline" numberOfLines={1}>
                {item.title}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            <View style={styles.open}>
              <Text variant="caption" tone="inverse">
                {t('homeFocus.rateNow')}
              </Text>
              <Icon
                icon={ArrowUpRight}
                size="small"
                color={colors.surface}
                decorative
              />
            </View>
          </PressSurface>
        ))}
      </View>
      <Text variant="caption" tone="secondary">
        {t('home.productsNote')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[12] },
  list: { gap: spacing[8] },
  card: {
    padding: spacing[8],
    paddingRight: spacing[12],
    backgroundColor: premium.canvas,
    borderRadius: radius[20],
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  open: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    minHeight: spacing[32],
    paddingHorizontal: spacing[12],
  },
});
