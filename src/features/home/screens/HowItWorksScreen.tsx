import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import BookHeart from 'lucide-react-native/icons/book-heart';
import FileDown from 'lucide-react-native/icons/file-down';
import MessageSquareHeart from 'lucide-react-native/icons/message-square-heart';
import QrCode from 'lucide-react-native/icons/qr-code';
import Utensils from 'lucide-react-native/icons/utensils';
import Wallet from 'lucide-react-native/icons/wallet';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Reveal } from '@/components/ratings/Reveal';
import { colors, radius, spacing } from '@/design';

/** The current product, step by step: only what this build actually does. */
const STEPS: [LucideIcon, string][] = [
  [Utensils, 'meal'],
  [QrCode, 'scan'],
  [FileDown, 'import'],
  [MessageSquareHeart, 'rate'],
  [Wallet, 'cashback'],
  [BookHeart, 'keep'],
];
const FACTS = ['nonPartner', 'partnerOnly', 'oncePerItem', 'restaurantsOnly'];

export default function HowItWorksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
      <View accessibilityRole="list" style={styles.steps}>
        {STEPS.map(([icon, name], index) => (
          <Reveal key={name} order={index} style={styles.step}>
            <View style={styles.rail}>
              <View style={styles.dot}>
                <Icon
                  icon={icon}
                  size="small"
                  color={colors.surface}
                  decorative
                />
              </View>
              {index < STEPS.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.copy}>
              <Text variant="caption" style={styles.stepNo}>
                {t('howItWorks.step', { n: index + 1 })}
              </Text>
              <Text variant="headline">{t(`howItWorks.${name}Title`)}</Text>
              <Text tone="secondary">{t(`howItWorks.${name}Body`)}</Text>
            </View>
          </Reveal>
        ))}
      </View>
      <View style={styles.facts}>
        <Text variant="headline" accessibilityRole="header">
          {t('howItWorks.factsTitle')}
        </Text>
        {FACTS.map((name) => (
          <View key={name} style={styles.fact}>
            <View style={styles.bullet} />
            <Text style={styles.factText}>{t(`howItWorks.${name}`)}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { gap: spacing[8] },
  headline: { color: colors.brand.primary },
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: spacing[16] },
  rail: { alignItems: 'center', width: 40 },
  dot: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: spacing[4],
    backgroundColor: colors.brand.border,
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4], paddingBottom: spacing[24] },
  stepNo: { color: colors.brand.secondary, letterSpacing: 0.6 },
  facts: {
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  fact: { flexDirection: 'row', gap: spacing[12], alignItems: 'flex-start' },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: colors.brand.primary,
  },
  factText: { flex: 1, color: colors.ink },
});
