import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Wallet from 'lucide-react-native/icons/wallet';
import Clock from 'lucide-react-native/icons/clock';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Brand } from '@/components/ui/Brand';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { colors, radius, spacing } from '@/design';
import { formatMoney } from '@/lib/money';

export function WalletSurface({
  children,
  pendingMinor,
}: {
  children: ReactNode;
  pendingMinor?: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.wallet}>
      <View style={styles.top}>
        <Brand inverse />
        <Icon icon={Wallet} color={colors.brand.onDeep} decorative />
      </View>
      <View style={styles.balance}>
        <Text variant="caption" style={styles.muted}>
          {t('home.balance')}
        </Text>
        {children}
      </View>
      <ReceiptRule inverse />
      <View style={styles.bottom}>
        <Text variant="caption" style={[styles.muted, styles.flex]}>
          {t('home.universalWallet')}
        </Text>
        {pendingMinor !== undefined && pendingMinor > 0 && (
          <View style={styles.pending}>
            <Icon
              icon={Clock}
              size="small"
              color={colors.brand.onDeep}
              decorative
            />
            <Text variant="caption" style={styles.white}>
              {t('home.pending', { amount: formatMoney(pendingMinor) })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wallet: {
    backgroundColor: colors.brand.deep,
    borderRadius: radius[24],
    padding: spacing[24],
    gap: spacing[12],
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balance: {
    gap: spacing[8],
    paddingTop: spacing[20],
    paddingBottom: spacing[8],
  },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[16],
    alignItems: 'center',
  },
  flex: { flexGrow: 1, flexBasis: '40%' },
  pending: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  white: { color: colors.surface },
  muted: { color: colors.brand.onDeep },
});
