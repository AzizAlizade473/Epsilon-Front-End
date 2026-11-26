import BadgeCheck from 'lucide-react-native/icons/badge-check';
import X from 'lucide-react-native/icons/x';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { billIdentity } from '@/hooks/billView';
import { formatDate, formatTime } from '@/lib/date';
import type { Receipt } from '@/services/contracts';

const LOGO = 88;

/** Says where the data came from: only an authorised provider is "verified". */
const SOURCE = {
  verified: 'receipt.status.verified',
  official_image: 'receipt.official',
  paper_photo: 'fiscal.paperPhoto',
  test_data: 'fiscal.testData',
} as const;

/** Who and when, in reading order: logo, name, branch, address, visit. */
export function ReceiptHeader({
  receipt,
  onClose,
  showSource = true,
}: {
  receipt: Receipt;
  onClose?: () => void;
  /** false where the screen states the source itself. */
  showSource?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const fiscal = receipt.fiscal;
  const { name, branch, logoName } = billIdentity(receipt);
  const address = fiscal?.merchant.address;
  return (
    <View style={styles.header}>
      {onClose && (
        <View style={styles.close}>
          <IconButton
            icon={X}
            accessibilityLabel={t('navigation.close')}
            onPress={onClose}
          />
        </View>
      )}
      <Animated.View
        entering={ZoomIn.duration(300).reduceMotion(ReduceMotion.System)}
      >
        <BrandBadge
          name={logoName}
          logoUrl={receipt.restaurant.logoUrl}
          size={LOGO}
        />
      </Animated.View>
      <Text style={styles.name} accessibilityRole="header">
        {name}
      </Text>
      {branch && <Text style={styles.branch}>{branch}</Text>}
      {address && <Text style={styles.meta}>{address}</Text>}
      <Text style={styles.meta}>
        {`${formatDate(receipt.issuedAt, { locale: i18n.language })} · ${formatTime(receipt.issuedAt)}`}
      </Text>
      {showSource && receipt.status === 'verified' && (
        <View style={styles.source}>
          <Icon
            icon={BadgeCheck}
            size="small"
            color={o.colors.rated}
            decorative
          />
          <Text style={styles.sourceText}>
            {t(SOURCE[fiscal?.verification.status ?? 'verified'])}
          </Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing[4] },
  close: { position: 'absolute', right: 0, top: 0, zIndex: 1 },
  name: {
    ...o.type.amount,
    color: o.colors.ink,
    textAlign: 'center',
    marginTop: spacing[12],
  },
  branch: { ...o.type.product, color: o.colors.ink, textAlign: 'center' },
  meta: { ...o.type.caption, color: o.colors.secondary, textAlign: 'center' },
  source: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  sourceText: {
    ...o.type.caption,
    fontWeight: '600',
    color: o.colors.rated,
  },
});
