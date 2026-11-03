import { useTranslation } from 'react-i18next';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { PurchaseArtwork } from '@/components/purchase/PurchaseArtwork';
import { colors, radius, spacing } from '@/design';

export function ScanLead({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <View style={styles.scene}>
        <View style={styles.copy}>
          <Text variant="caption" style={styles.soft}>
            {t('purchaseDirection.startHere')}
          </Text>
          <Text variant="title2" style={styles.headline}>
            {t('purchaseDirection.scanHeadline')}
          </Text>
        </View>
        <PurchaseArtwork />
      </View>
      <PressSurface
        onPress={onPress}
        accessibilityLabel={t('home.scan')}
        contentStyle={styles.button}
        pressedColor={colors.brand.border}
      >
        <Text variant="headline" style={styles.buttonText}>
          {t('home.scan')}
        </Text>
        <Icon icon={ArrowUpRight} color={colors.brand.primary} decorative />
      </PressSurface>
      <Text variant="caption" style={styles.soft}>
        {t('purchaseDirection.scanSequence')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brand.primary,
    borderTopLeftRadius: radius[24],
    borderBottomRightRadius: radius[24],
    padding: spacing[20],
    gap: spacing[16],
  },
  scene: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  copy: { flex: 1, minWidth: 0, gap: spacing[12] },
  headline: { color: colors.surface },
  soft: { color: colors.brand.onDeep },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius[12],
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
  },
  buttonText: { color: colors.brand.primary, flexShrink: 1 },
});
