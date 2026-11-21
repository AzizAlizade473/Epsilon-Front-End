import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Info from 'lucide-react-native/icons/info';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { formatDate, formatTime } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import type { FiscalInfo } from '@/services/contracts';

/** One label/value row; hidden when the official record has no value. */
function Row({ label, value }: { label: string; value: string | null }) {
  if (value === null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>
        {value}
      </Text>
    </View>
  );
}

const money = (minor: number | null) =>
  minor === null ? null : formatMoney(minor);

/**
 * Header part of a scanned fiscal receipt: who issued it, its business sector and
 * what Epsilon allows for it. Every value comes from the backend; nothing is
 * computed or decided here.
 */
export function FiscalSummary({
  fiscal,
  onScanAnother,
}: {
  fiscal: FiscalInfo;
  onScanAnother?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { classification: c, eligibility: e, merchant: m, receipt: r } = fiscal;
  const unsupported = !e.ratingAllowed;
  const typeLabel = t(`fiscal.type.${c.businessType}`, {
    defaultValue: t('fiscal.type.unknown'),
  });
  return (
    <View style={styles.block}>
      <View style={styles.sector} accessibilityRole="summary">
        <Text style={styles.sectorType}>{typeLabel}</Text>
        <Text style={styles.label}>
          {t('fiscal.sectorLine', { sector: t(`fiscal.sector.${c.sector}`) })}
        </Text>
        <View style={styles.chips}>
          <Chip
            label={t(
              fiscal.verification.status === 'test_data'
                ? 'fiscal.testData'
                : 'fiscal.verified',
            )}
            tone={
              fiscal.verification.status === 'test_data' ? 'warning' : 'success'
            }
          />
          {c.status === 'ai' && (
            <Chip label={t('fiscal.aiAssisted')} tone="brand" />
          )}
          {fiscal.partner.isPartner && (
            <Chip label={t('fiscal.partner')} tone="brand" />
          )}
        </View>
      </View>
      {e.reason && (
        <View
          style={[styles.notice, unsupported && styles.warning]}
          accessibilityRole="alert"
        >
          <Icon
            icon={unsupported ? TriangleAlert : Info}
            size="small"
            color={unsupported ? o.colors.pending : o.colors.secondary}
            decorative
          />
          <Text style={styles.noticeText}>
            {t(`fiscal.reason.${e.reason}`, { type: typeLabel.toLowerCase() })}
          </Text>
        </View>
      )}
      {unsupported && onScanAnother && (
        <Button
          variant="secondary"
          label={t('fiscal.scanAnother')}
          onPress={onScanAnother}
        />
      )}
      <View style={styles.card}>
        <Text style={styles.heading} accessibilityRole="header">
          {t('fiscal.merchantSection')}
        </Text>
        <Row label={t('fiscal.legalName')} value={m.legalName} />
        <Row label={t('fiscal.voen')} value={m.voen} />
        <Row label={t('fiscal.objectName')} value={m.objectName} />
        <Row label={t('fiscal.objectCode')} value={m.objectCode} />
        <Row label={t('fiscal.address')} value={m.address} />
      </View>
      <View style={styles.card}>
        <Text style={styles.heading} accessibilityRole="header">
          {t('fiscal.receiptSection')}
        </Text>
        <Row label={t('fiscal.number')} value={r.number} />
        <Row
          label={t('fiscal.dateTime')}
          value={`${formatDate(r.issuedAt, { locale: i18n.language })} · ${formatTime(r.issuedAt)}`}
        />
        <Row label={t('fiscal.fiscalId')} value={r.fiscalId} />
        <Row
          label={t('fiscal.payment')}
          value={
            r.payment.method
              ? t(`fiscal.paymentMethod.${r.payment.method}`, {
                  defaultValue: r.payment.method,
                })
              : null
          }
        />
      </View>
    </View>
  );
}

/** Footer part: totals, the full record on demand, and a dev-only JSON inspector. */
export function FiscalFooter({ fiscal }: { fiscal: FiscalInfo }) {
  const { t } = useTranslation();
  const [more, setMore] = useState(false);
  const [json, setJson] = useState(false);
  const { receipt: r, device: d } = fiscal;
  const extra = Object.entries(fiscal.additionalFields);
  return (
    <View style={styles.block}>
      <View style={styles.card}>
        <Row label={t('fiscal.subtotal')} value={money(r.subtotalMinor)} />
        <Row label={t('fiscal.discount')} value={money(r.discountMinor)} />
        {r.vatBreakdown.length > 0 ? (
          r.vatBreakdown.map((v) => (
            <Row
              key={v.ratePercent}
              label={t('fiscal.vatRate', { rate: v.ratePercent })}
              value={formatMoney(v.amountMinor)}
            />
          ))
        ) : (
          <Row label={t('fiscal.vat')} value={money(r.vatMinor)} />
        )}
        <Row label={t('fiscal.total')} value={formatMoney(r.totalMinor)} />
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: more }}
        onPress={() => setMore((v) => !v)}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {t(more ? 'fiscal.lessDetails' : 'fiscal.moreDetails')}
        </Text>
      </TouchableOpacity>
      {more && (
        <View style={styles.card}>
          <Row label={t('fiscal.documentId')} value={r.documentId} />
          <Row
            label={t('fiscal.receiptType')}
            value={
              r.type
                ? t(`fiscal.receiptTypes.${r.type}`, { defaultValue: r.type })
                : null
            }
          />
          <Row label={t('fiscal.cash')} value={money(r.payment.cashMinor)} />
          <Row
            label={t('fiscal.cashless')}
            value={money(r.payment.cashlessMinor)}
          />
          <Row label={t('fiscal.bonus')} value={money(r.payment.bonusMinor)} />
          <Row
            label={t('fiscal.change')}
            value={money(r.payment.changeMinor)}
          />
          <Row label={t('fiscal.deviceModel')} value={d.model} />
          <Row label={t('fiscal.deviceSerial')} value={d.serialNumber} />
          <Row label={t('fiscal.nmq')} value={d.nmqRegistrationNumber} />
          {extra.map(([key, value]) => (
            <Row
              key={key}
              label={key}
              value={value === null ? null : String(value)}
            />
          ))}
          <Row
            label={t('fiscal.classifiedBy')}
            value={`${t(`fiscal.method.${fiscal.classification.method}`)}${
              fiscal.classification.evidence.length
                ? ` — ${fiscal.classification.evidence.join('; ')}`
                : ''
            }`}
          />
          <Row
            label={t('fiscal.source')}
            value={fiscal.verification.provider}
          />
        </View>
      )}
      {__DEV__ && (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setJson((v) => !v)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{t('fiscal.devJson')}</Text>
          </TouchableOpacity>
          {json && (
            <Text style={styles.json} selectable>
              {JSON.stringify(fiscal, null, 2)}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing[12] },
  sector: {
    gap: spacing[4],
    padding: spacing[12],
    borderRadius: o.radius.card,
    backgroundColor: o.colors.primaryTint,
  },
  sectorType: { ...o.type.title, color: o.colors.ink },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    paddingTop: spacing[4],
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: o.radius.card,
    backgroundColor: o.colors.soft,
  },
  warning: { backgroundColor: o.colors.pendingTint },
  noticeText: { ...o.type.caption, color: o.colors.ink, flex: 1 },
  card: {
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: o.radius.card,
    borderWidth: 1,
    borderColor: o.colors.border,
    backgroundColor: o.colors.surface,
  },
  heading: { ...o.type.product, color: o.colors.ink },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  // Labels may wrap (long RU/AZ terms) but never take more than ~45 % of the row.
  label: { ...o.type.caption, color: o.colors.secondary, maxWidth: '45%' },
  value: {
    ...o.type.caption,
    color: o.colors.ink,
    flex: 1,
    textAlign: 'right',
  },
  toggle: { minHeight: 44, justifyContent: 'center' },
  toggleText: { ...o.type.caption, fontWeight: '700', color: o.colors.primary },
  json: { ...o.type.caption, fontFamily: 'monospace', color: o.colors.ink },
});
