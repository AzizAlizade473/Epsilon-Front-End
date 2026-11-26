import BadgeCheck from 'lucide-react-native/icons/badge-check';
import X from 'lucide-react-native/icons/x';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { layout, spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { displayMerchantName, matchBrand } from '@/lib/brands';
import { formatDate, formatTime } from '@/lib/date';
import type { Receipt } from '@/services/contracts';

/** Says where the data came from: only an authorised provider is "verified". */
const SOURCE = {
  verified: 'receipt.status.verified',
  official_image: 'receipt.official',
  paper_photo: 'fiscal.paperPhoto',
  test_data: 'fiscal.testData',
} as const;

/** Who and when, in reading order: logo, name, branch, visit, receipt number. */
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
  const merchant = fiscal?.merchant.objectName ?? receipt.restaurant.name;
  const name = displayMerchantName(merchant);
  const branch = receipt.branch.name;
  const number = fiscal?.receipt.number;
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
      {/* The establishment name can be only a branch; the logo may match the chain. */}
      <BrandBadge
        name={matchBrand(merchant) ? merchant : receipt.restaurant.name}
        logoUrl={receipt.restaurant.logoUrl}
        size={layout.profileAvatarSize}
      />
      <Text style={styles.name} accessibilityRole="header">
        {name}
      </Text>
      {branch !== merchant && <Text style={styles.branch}>{branch}</Text>}
      <Text style={styles.meta}>
        {`${formatDate(receipt.issuedAt, { locale: i18n.language })} · ${formatTime(receipt.issuedAt)}`}
      </Text>
      {number && (
        <Text style={styles.meta}>
          {t('receipt.identifier', { id: number })}
        </Text>
      )}
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
    ...o.type.title,
    color: o.colors.ink,
    textAlign: 'center',
    marginTop: spacing[8],
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
