import { Image } from 'expo-image';
import MapPin from 'lucide-react-native/icons/map-pin';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { colors, layout, radius, spacing } from '@/design';
import type { Restaurant } from '@/services/contracts';

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useTranslation();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const logo =
    restaurant.logoUrl?.startsWith('https://') &&
    restaurant.logoUrl !== failedUrl
      ? restaurant.logoUrl
      : null;
  const branches = t('restaurants.branches', { count: restaurant.branchCount });
  const initials = restaurant.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('');
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${restaurant.name}, ${branches}`}
      style={styles.tile}
    >
      <View style={styles.row}>
        <View style={styles.logo}>
          {logo ? (
            <Image
              source={{ uri: logo }}
              recyclingKey={restaurant.id}
              style={styles.image}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
              accessible={false}
              onError={() => setFailedUrl(logo)}
            />
          ) : (
            <Text variant="title1" style={styles.monogram}>
              {initials}
            </Text>
          )}
        </View>
        <View style={styles.copy}>
          <Text variant="caption" style={styles.label}>
            {t('visual.partner')}
          </Text>
          <Text variant="title2">{restaurant.name}</Text>
          <View style={styles.branches}>
            <Icon
              icon={MapPin}
              size="small"
              color={colors.inkSecondary}
              decorative
            />
            <Text variant="caption" tone="secondary">
              {branches}
            </Text>
          </View>
        </View>
      </View>
      <ReceiptRule />
      <Text variant="caption" tone="secondary">
        {t('visual.restaurantHint')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius[20],
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    padding: spacing[20],
    marginBottom: spacing[16],
    gap: spacing[8],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.detailRowHeight,
    gap: spacing[16],
  },
  logo: {
    width: layout.partnerMarkSize,
    height: layout.partnerMarkSize,
    backgroundColor: colors.paper,
    borderRadius: radius[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: layout.profileAvatarSize, height: layout.profileAvatarSize },
  monogram: { color: colors.paperInk },
  label: { color: colors.brand.primary },
  branches: { flexDirection: 'row', gap: spacing[4], alignItems: 'center' },
  copy: { flex: 1, gap: spacing[8], minWidth: 0 },
});
