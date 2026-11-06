import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Star from 'lucide-react-native/icons/star';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { formatMoney } from '@/lib/money';
import { safeIdSchema } from '@/lib/deep-link';
import { useCatalog } from '../catalog';
import { FoodImage } from '@/components/food/FoodImage';

export default function PublicDishScreen() {
  const { id, dishId } = useLocalSearchParams<{ id: string; dishId: string }>();
  const valid =
    safeIdSchema.safeParse(id).success &&
    safeIdSchema.safeParse(dishId).success;
  const catalog = useCatalog(valid ? id : '');
  const dish = catalog.data?.dishes.find((d) => d.id === dishId);
  const router = useRouter();
  const { t } = useTranslation();
  const width =
    Math.min(useWindowDimensions().width, layout.contentMaxWidth) -
    spacing[20] * 2;
  return (
    <Screen
      surface="surface"
      leading={
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel={t('navigation.back')}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/restaurants')
          }
        />
      }
    >
      {dish ? (
        <>
          <FoodImage
            photo={dish.photo}
            width={width}
            height={premium.dishDetailHeight}
          />
          <Text variant="caption" style={styles.accent}>
            {t(dish.sectionKey)}
          </Text>
          <Text variant="title1" accessibilityRole="header">
            {t(dish.nameKey)}
          </Text>
          <View style={styles.line}>
            <Text variant="title2">{formatMoney(dish.priceMinor)}</Text>
            <View style={styles.score}>
              <Icon icon={Star} color={colors.brand.accent} decorative />
              <Text variant="headline">{dish.score.toFixed(1)}</Text>
              <Text variant="caption" tone="secondary">
                {t('premium.reviewCount', { count: dish.count })}
              </Text>
            </View>
          </View>
          <Text tone="secondary">{t(dish.descriptionKey)}</Text>
          <View style={styles.rule} />
          <Text variant="title2" accessibilityRole="header">
            {t('premium.comments')}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('premium.sampleMenu')}
          </Text>
          {dish.comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <View style={styles.line}>
                <Text variant="callout">{t('premium.guest')}</Text>
                <View style={styles.score}>
                  <Icon
                    icon={Star}
                    color={colors.brand.accent}
                    size="small"
                    decorative
                  />
                  <Text variant="caption">{comment.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text tone="secondary">{t(comment.textKey)}</Text>
            </View>
          ))}
          <View style={styles.notice}>
            <Text variant="caption" style={styles.accent}>
              {t('premium.purchaseOnly')}
            </Text>
          </View>
        </>
      ) : (
        <Text accessibilityRole="alert">
          {t(catalog.isLoading ? 'common.loading' : 'premium.menuUnavailable')}
        </Text>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  accent: { color: colors.brand.accent },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[12],
  },
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  rule: {
    height: layout.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing[8],
  },
  comment: {
    gap: spacing[12],
    paddingVertical: spacing[16],
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
  },
  notice: {
    padding: spacing[16],
    backgroundColor: colors.brand.tint,
    borderRadius: radius[16],
  },
});
