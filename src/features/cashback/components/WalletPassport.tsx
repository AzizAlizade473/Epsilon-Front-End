import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react-native/icons/check';
import Clock from 'lucide-react-native/icons/clock';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Brand } from '@/components/ui/Brand';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { colors, layout, radius, spacing } from '@/design';
import { purchaseDesign as p } from '@/design/purchase';
import { formatMoney } from '@/lib/money';

export function WalletPassport({
  children,
  pendingMinor,
}: {
  children: ReactNode;
  pendingMinor?: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.passport}>
      <View style={styles.binding} />
      <View style={styles.top}>
        <Text variant="caption" style={styles.label}>
          {t('home.universalWallet')}
        </Text>
        <Brand />
      </View>
      <View style={styles.amount}>{children}</View>
      <View style={styles.confirmed}>
        <View style={styles.check}>
          <Icon icon={Check} color={colors.surface} size="small" decorative />
        </View>
        <Text variant="callout" style={styles.label}>
          {t('home.balance')}
        </Text>
      </View>
      <ReceiptRule />
      <View style={styles.pending}>
        <View style={styles.pendingCopy}>
          <Icon
            icon={Clock}
            size="small"
            color={colors.brand.accent}
            decorative
          />
          <Text variant="callout">{t('purchaseDirection.pendingBalance')}</Text>
        </View>
        <Text variant="headline" style={styles.label}>
          {pendingMinor === undefined ? '—' : formatMoney(pendingMinor)}
        </Text>
      </View>
      <Text variant="caption" tone="secondary">
        {t('purchaseDirection.pendingHint')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  passport: {
    backgroundColor: colors.brand.tint,
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
    borderRadius: radius[12],
    padding: spacing[24],
    gap: spacing[16],
    overflow: 'hidden',
  },
  binding: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: p.binding,
    backgroundColor: colors.brand.primary,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  amount: { paddingTop: spacing[16] },
  label: { color: colors.brand.primary },
  confirmed: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  check: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    padding: spacing[4],
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing[12],
  },
  pendingCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
});
