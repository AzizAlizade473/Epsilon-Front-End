import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import Eye from 'lucide-react-native/icons/eye';
import Info from 'lucide-react-native/icons/info';
import Wallet from 'lucide-react-native/icons/wallet';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { Reveal } from '@/components/ratings/Reveal';
import { colors, layout, radius, spacing, typography } from '@/design';
import { computeCashbackMinor } from '@/lib/cashback';
import { formatMoney } from '@/lib/money';

type Sector = 'restaurants' | 'supermarkets';
const STEPS = [1, 2, 3, 4, 5, 6] as const;
const LEVELS: [LucideIcon, string][] = [
  [Eye, 'levelGeneral'],
  [BadgeCheck, 'levelVerified'],
  [Wallet, 'levelCashback'],
];
// A worked example from the one pilot policy, never a hand-typed amount.
const EXAMPLE_RECEIPT_MINOR = 2500;

export default function HowItWorksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [sector, setSector] = useState<Sector>('restaurants');
  const key = sector === 'restaurants' ? 'r' : 's';
  return (
    <Screen
      surface="surface"
      title={t('howItWorks.title')}
      leading={
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel={t('navigation.back')}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
        />
      }
    >
      <View style={styles.lead}>
        <Text variant="title2" style={styles.headline}>
          {t('howItWorks.headline')}
        </Text>
        <Text tone="secondary">{t('howItWorks.intro')}</Text>
      </View>
      <SegmentedControl
        label={t('howItWorks.sectorLabel')}
        options={[
          { value: 'restaurants', label: t('howItWorks.sectorRestaurants') },
          { value: 'supermarkets', label: t('howItWorks.sectorSupermarkets') },
        ]}
        value={sector}
        onValueChange={setSector}
      />
      <View accessibilityRole="list" style={styles.steps}>
        {STEPS.map((n, index) => (
          <Reveal key={`${key}${n}`} order={index} style={styles.step}>
            <View style={styles.rail}>
              <View style={styles.dot}>
                <Text variant="caption" style={styles.dotText}>
                  {n}
                </Text>
              </View>
              {n < STEPS.length && <View style={styles.line} />}
            </View>
            <View style={styles.copy}>
              <Text variant="headline">{t(`howItWorks.${key}${n}Title`)}</Text>
              <Text tone="secondary">{t(`howItWorks.${key}${n}Body`)}</Text>
            </View>
          </Reveal>
        ))}
      </View>
      <View style={styles.use}>
        <Text variant="callout" style={styles.useText}>
          {t(
            sector === 'restaurants'
              ? 'howItWorks.useRestaurants'
              : 'howItWorks.useSupermarkets',
          )}
        </Text>
      </View>
      <View style={styles.block}>
        <Text variant="title2" accessibilityRole="header">
          {t('howItWorks.levelsTitle')}
        </Text>
        {LEVELS.map(([icon, name]) => (
          <View key={name} style={styles.level}>
            <View style={styles.badge}>
              <Icon icon={icon} color={colors.brand.primary} decorative />
            </View>
            <View style={styles.copy}>
              <Text variant="headline">{t(`howItWorks.${name}Title`)}</Text>
              <Text variant="caption" tone="secondary">
                {t(`howItWorks.${name}Body`)}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.rule}>
        <Text variant="callout" style={styles.ruleTitle}>
          {t('howItWorks.ruleTitle')}
        </Text>
        <Text variant="caption" style={styles.ruleBody}>
          {t('howItWorks.ruleBody', {
            receipt: formatMoney(EXAMPLE_RECEIPT_MINOR),
            reward: formatMoney(computeCashbackMinor(EXAMPLE_RECEIPT_MINOR)),
          })}
        </Text>
      </View>
      <View style={styles.block}>
        <View style={styles.realityHead}>
          <Icon
            icon={Info}
            size="small"
            color={colors.brand.accent}
            decorative
          />
          <Text variant="headline">{t('howItWorks.realityTitle')}</Text>
        </View>
        <Text variant="caption" tone="secondary">
          {t('howItWorks.realityDemo')}
        </Text>
        <Text variant="caption" tone="secondary">
          {t('howItWorks.realityBhos')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { gap: spacing[8] },
  headline: { color: colors.brand.primary },
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: spacing[16] },
  rail: { alignItems: 'center', width: spacing[32] },
  dot: {
    width: spacing[32],
    height: spacing[32],
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: colors.surface },
  line: {
    flex: 1,
    width: 2,
    marginVertical: spacing[4],
    backgroundColor: colors.brand.border,
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4], paddingBottom: spacing[20] },
  use: {
    padding: spacing[16],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  useText: { color: colors.brand.primary },
  block: { gap: spacing[12] },
  level: { flexDirection: 'row', gap: spacing[12], alignItems: 'flex-start' },
  badge: {
    width: layout.leadingIconSize + spacing[8],
    height: layout.leadingIconSize + spacing[8],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {
    gap: spacing[4],
    padding: spacing[16],
    borderRadius: radius[16],
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
  },
  ruleTitle: { color: colors.brand.primary },
  ruleBody: { ...typography.caption, color: colors.inkSecondary },
  realityHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
});
