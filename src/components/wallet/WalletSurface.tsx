import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Brand } from '@/components/ui/Brand';
import { colors, layout, radius, spacing } from '@/design';
import { formatMoney } from '@/lib/money';

/** One quiet balance surface, shared by Home and Cashback. */
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
      <Brand inverse />
      <View style={styles.balance}>
        <Text variant="caption" style={styles.muted}>
          {t('home.balance')}
        </Text>
        {children}
      </View>
      <View style={styles.bottom}>
        <Text variant="caption" style={styles.muted}>
          {t('home.universalWallet')}
        </Text>
        {pendingMinor !== undefined && pendingMinor > 0 && (
          <Text variant="caption" tone="inverse">
            {t('home.pending', { amount: formatMoney(pendingMinor) })}
          </Text>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wallet: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius[20],
    padding: spacing[24],
    gap: spacing[16],
  },
  balance: { gap: spacing[4] },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    justifyContent: 'space-between',
    borderTopWidth: layout.hairlineWidth,
    borderTopColor: colors.brand.accent,
    paddingTop: spacing[16],
  },
  muted: { color: colors.brand.onDeep },
});
