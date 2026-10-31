import { Image } from 'expo-image';
import Store from 'lucide-react-native/icons/store';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { colors, layout, spacing } from '@/design';
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
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${restaurant.name}, ${branches}`}
      style={styles.row}
    >
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
          <Icon icon={Store} decorative />
        )}
      </View>
      <View style={styles.copy}>
        <Text>{restaurant.name}</Text>
        <Text variant="caption">{branches}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.detailRowHeight,
    paddingVertical: spacing[12],
    gap: spacing[12],
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    width: layout.leadingIconSize,
    height: layout.leadingIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: layout.leadingIconSize, height: layout.leadingIconSize },
  copy: { flex: 1, gap: spacing[4], minWidth: 0 },
});
