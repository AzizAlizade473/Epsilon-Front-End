import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import Info from 'lucide-react-native/icons/info';
import Star from 'lucide-react-native/icons/star';
import Store from 'lucide-react-native/icons/store';
import UtensilsCrossed from 'lucide-react-native/icons/utensils-crossed';
import Wallet from 'lucide-react-native/icons/wallet';
import X from 'lucide-react-native/icons/x';
import type { LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { formatDate, formatTime } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import type { FiscalInfo, Receipt } from '@/services/contracts';
import { formatQuantity } from './DishCard';
import { FiscalFooter, FiscalSummary } from './FiscalDetails';

const WHY: [LucideIcon, string][] = [
  [UtensilsCrossed, 'notEligible.why1'],
  [Star, 'notEligible.why2'],
  [Wallet, 'notEligible.why3'],
];

/** Only an authorised provider makes a receipt "verified"; an official image is "read". */
function readBadge(fiscal: FiscalInfo) {
  return fiscal.verification.status === 'verified'
    ? 'notEligible.verified'
    : fiscal.verification.status === 'test_data'
      ? 'fiscal.testData'
      : 'notEligible.read';
}

/**
 * Result state B: a valid fiscal receipt from a business Epsilon does not cover
 * (supermarket, pharmacy, unknown, …). Reads as an outcome, not an error: the receipt
 * itself first, then why it is outside the programme, then what to do next. The
 * receipt details stay available but folded away.
 */
export function NotEligibleReceipt({
  receipt,
  fiscal,
  onClose,
  onScanAnother,
  onExplore,
  onHome,
}: {
  receipt: Receipt;
  fiscal: FiscalInfo;
  onClose?: () => void;
  onScanAnother?: () => void;
  onExplore?: () => void;
  onHome: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [details, setDetails] = useState(false);
  const c = fiscal.classification;
  const unknown = c.businessType === 'unknown' || c.sector === 'unknown';
  const type = t(`fiscal.type.${c.businessType}`, {
    defaultValue: t('fiscal.type.unknown'),
  });
  return (
    <ScrollView
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.amount}>{formatMoney(receipt.totalMinor)}</Text>
          <Text style={styles.merchant}>{receipt.restaurant.name}</Text>
          <Text style={styles.caption}>
            {formatDate(receipt.issuedAt, { locale: i18n.language }) +
              ' · ' +
              formatTime(receipt.issuedAt)}
          </Text>
        </View>
        {onClose && (
          <IconButton
            icon={X}
            accessibilityLabel={t('navigation.close')}
            onPress={onClose}
          />
        )}
      </View>

      <View style={styles.badges}>
        <View style={[styles.badge, styles.badgeOk]}>
          <Icon
            icon={BadgeCheck}
            size="small"
            color={o.colors.rated}
            decorative
          />
          <Text style={[styles.badgeText, { color: o.colors.rated }]}>
            {t(readBadge(fiscal))}
          </Text>
        </View>
        <View style={[styles.badge, styles.badgeMuted]}>
          <Icon
            icon={Info}
            size="small"
            color={o.colors.secondary}
            decorative
          />
          <Text style={[styles.badgeText, { color: o.colors.secondary }]}>
            {t('notEligible.badge')}
          </Text>
        </View>
      </View>

      <View style={styles.message} accessibilityRole="summary">
        <View style={styles.storeMark}>
          <Icon icon={Store} color={o.colors.primary} decorative />
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          {unknown
            ? t('notEligible.unknownTitle')
            : t('notEligible.title', { type })}
        </Text>
        <Text style={styles.lead}>
          {unknown ? t('notEligible.unknownBody') : t('notEligible.body')}
        </Text>
        <Text style={styles.note}>{t('notEligible.note')}</Text>
      </View>

      <View style={styles.why}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('notEligible.whyTitle')}
        </Text>
        {WHY.map(([icon, key]) => (
          <View key={key} style={styles.whyRow}>
            <Icon
              icon={icon}
              size="small"
              color={o.colors.primary}
              decorative
            />
            <Text style={styles.whyText}>{t(key)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {onScanAnother && (
          <Button label={t('fiscal.scanAnother')} onPress={onScanAnother} />
        )}
        {onExplore && (
          <Button
            variant="secondary"
            label={t('notEligible.explore')}
            onPress={onExplore}
          />
        )}
        <Button variant="ghost" label={t('feedback.home')} onPress={onHome} />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: details }}
        onPress={() => setDetails((value) => !value)}
        style={styles.toggle}
      >
        <Text style={styles.sectionTitle}>{t('notEligible.details')}</Text>
        <Icon
          icon={details ? ChevronUp : ChevronDown}
          size="small"
          color={o.colors.secondary}
          decorative
        />
      </TouchableOpacity>
      {details && (
        <View style={styles.details}>
          <View style={styles.card}>
            <Row label={t('notEligible.category')} value={type} />
            <Row
              label={t('notEligible.support')}
              value={t('notEligible.badge')}
            />
            <Row
              label={t('notEligible.reason')}
              value={t('notEligible.reasonValue')}
            />
          </View>
          <FiscalSummary fiscal={fiscal} compact />
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {t('fiscal.products')}
            </Text>
            {receipt.items.map((item) => (
              <View key={item.id} style={styles.product}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={styles.productLine}>
                  <Text style={styles.caption}>
                    {`${item.line ? formatQuantity(item.line.quantityMilli) : item.quantity}${
                      item.line?.unit ? ` ${item.line.unit}` : ''
                    } × ${formatMoney(item.unitPriceMinor)}`}
                  </Text>
                  <Text style={styles.value}>
                    {formatMoney(
                      item.line?.lineTotalMinor ??
                        item.unitPriceMinor * item.quantity,
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <FiscalFooter fiscal={fiscal} />
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[20], paddingBottom: spacing[24] },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  amount: { ...o.type.amount, color: o.colors.ink },
  merchant: { ...o.type.product, color: o.colors.ink },
  caption: { ...o.type.caption, color: o.colors.secondary },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginTop: -spacing[8],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4] + 2,
    borderRadius: o.radius.chip,
  },
  badgeOk: { backgroundColor: o.colors.ratedTint },
  badgeMuted: {
    backgroundColor: o.colors.soft,
    borderWidth: 1,
    borderColor: o.colors.emptyStar,
  },
  badgeText: { ...o.type.caption, fontWeight: '700' },
  message: {
    gap: spacing[8],
    padding: spacing[20],
    borderRadius: o.radius.card,
    backgroundColor: o.colors.primaryTint,
  },
  storeMark: {
    width: o.size.icon,
    height: o.size.icon,
    borderRadius: o.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: o.colors.surface,
    marginBottom: spacing[4],
  },
  heading: { ...o.type.title, color: o.colors.ink },
  lead: { ...o.type.product, fontWeight: '600', color: o.colors.ink },
  note: { ...o.type.caption, color: o.colors.secondary },
  why: { gap: spacing[12] },
  sectionTitle: { ...o.type.product, color: o.colors.ink },
  whyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12] },
  whyText: { ...o.type.caption, color: o.colors.ink, flex: 1 },
  actions: { gap: spacing[8] },
  toggle: {
    minHeight: o.size.target,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: o.colors.border,
    paddingTop: spacing[8],
  },
  details: { gap: spacing[12] },
  card: {
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: o.radius.card,
    borderWidth: 1,
    borderColor: o.colors.border,
    backgroundColor: o.colors.surface,
  },
  cardTitle: { ...o.type.product, color: o.colors.ink },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  label: { ...o.type.caption, color: o.colors.secondary, maxWidth: '45%' },
  value: {
    ...o.type.caption,
    color: o.colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  product: { gap: spacing[4] },
  productName: { ...o.type.caption, fontWeight: '700', color: o.colors.ink },
  productLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
});
