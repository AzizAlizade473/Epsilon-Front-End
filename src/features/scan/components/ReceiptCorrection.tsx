import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Trash from 'lucide-react-native/icons/trash';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { formatMoney } from '@/lib/money';
import type { CorrectedLine, ReceiptDraft } from '@/services/contracts';

type Row = { key: number; name: string; quantity: string; price: string };

/** "1,5" / "1.5" → thousandths; null when not a positive number with ≤ 3 decimals. */
export function toMilli(text: string): number | null {
  const m = /^\s*(\d{1,6})(?:[.,](\d{1,3}))?\s*$/.exec(text);
  if (!m) return null;
  const value = Number(m[1]) * 1000 + Number((m[2] ?? '').padEnd(3, '0') || 0);
  return value > 0 ? value : null;
}
/** "1,79" / "1.79" / "2" → qəpik; null when not a money amount. */
export function toMinor(text: string): number | null {
  const m = /^\s*(\d{1,7})(?:[.,](\d{1,2}))?\s*$/.exec(text);
  return m
    ? Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0)
    : null;
}
const decimal = (value: number, places: number) =>
  (value / 10 ** places).toFixed(places).replace(/\.?0+$/, '') || '0';

/** Row → line, or null while incomplete. The line total is always qty × price. */
export function toLine(row: Row): CorrectedLine | null {
  const quantityMilli = toMilli(row.quantity);
  const unitPriceMinor = toMinor(row.price);
  const name = row.name.trim();
  if (!name || quantityMilli === null || unitPriceMinor === null) return null;
  return {
    name,
    quantityMilli,
    unitPriceMinor,
    lineTotalMinor: Math.round((quantityMilli * unitPriceMinor) / 1000),
  };
}

let nextKey = 0;
const rowsFrom = (draft: ReceiptDraft): Row[] => [
  ...draft.items.map((item) => ({
    key: nextKey++,
    name: item.name,
    quantity: decimal(item.quantityMilli, 3),
    price: (item.unitPriceMinor / 100).toFixed(2),
  })),
  // Unreadable rows, as printed: the customer fixes the name and fills in the numbers.
  ...draft.unread.map((text) => ({
    key: nextKey++,
    name: text.replace(/^#\d+\s*/, '').replace(/(\s+[\d.,O]+)+\s*$/u, ''),
    quantity: '1',
    price: '',
  })),
];

/**
 * Completes a partly read receipt: the merchant, date and total come from the official
 * image (read-only here); the customer confirms or fixes the product lines, which must
 * add up to the printed total. The server checks the same rule and never pays cashback
 * on corrected receipts.
 */
export function ReceiptCorrection({
  draft,
  imageUri,
  busy,
  problem,
  onSubmit,
  onCancel,
}: {
  draft: ReceiptDraft;
  imageUri: string | null;
  busy: boolean;
  problem: string | null;
  onSubmit: (lines: CorrectedLine[]) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>(() =>
    rowsFrom(draft).length
      ? rowsFrom(draft)
      : [{ key: nextKey++, name: '', quantity: '1', price: '' }],
  );
  const lines = rows.map(toLine);
  const complete = lines.every((line) => line !== null) && lines.length > 0;
  const sum = lines.reduce(
    (total, line) => total + (line?.lineTotalMinor ?? 0),
    0,
  );
  const matches = draft.totalMinor === null || sum === draft.totalMinor;
  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  return (
    <ScrollView
      contentContainerStyle={styles.root}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="title2" accessibilityRole="header">
        {t('correction.title')}
      </Text>
      <Text tone="secondary">{t('correction.body')}</Text>
      <View style={styles.summary}>
        <Text variant="headline">
          {draft.merchantName ?? t('correction.unknownMerchant')}
        </Text>
        {draft.totalMinor !== null && (
          <Text>
            {t('correction.total', { total: formatMoney(draft.totalMinor) })}
          </Text>
        )}
      </View>
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={t('correction.image')}
        />
      )}
      {rows.map((row, index) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.rowHead}>
            <Text variant="callout">
              {t('correction.item', { n: index + 1 })}
            </Text>
            <IconButton
              icon={Trash}
              accessibilityLabel={t('correction.remove', { n: index + 1 })}
              disabled={busy || rows.length === 1}
              onPress={() =>
                setRows((current) => current.filter((r) => r.key !== row.key))
              }
            />
          </View>
          <Input
            label={t('correction.name')}
            value={row.name}
            onChangeText={(name) => update(row.key, { name })}
            maxLength={200}
            autoCapitalize="characters"
            editable={!busy}
          />
          <View style={styles.numbers}>
            <View style={styles.number}>
              <Input
                label={t('correction.quantity')}
                value={row.quantity}
                onChangeText={(quantity) => update(row.key, { quantity })}
                keyboardType="decimal-pad"
                maxLength={10}
                editable={!busy}
              />
            </View>
            <View style={styles.number}>
              <Input
                label={t('correction.price')}
                value={row.price}
                onChangeText={(price) => update(row.key, { price })}
                keyboardType="decimal-pad"
                maxLength={10}
                editable={!busy}
              />
            </View>
          </View>
        </View>
      ))}
      <Button
        variant="secondary"
        label={t('correction.add')}
        disabled={busy || rows.length >= 100}
        onPress={() =>
          setRows((current) => [
            ...current,
            { key: nextKey++, name: '', quantity: '1', price: '' },
          ])
        }
      />
      <View style={styles.summary} accessibilityLiveRegion="polite">
        <Text variant="headline">
          {draft.totalMinor === null
            ? t('correction.sumOnly', { sum: formatMoney(sum) })
            : t('correction.sum', {
                sum: formatMoney(sum),
                total: formatMoney(draft.totalMinor),
              })}
        </Text>
        {complete && !matches && (
          <Text tone="secondary">{t('correction.mismatch')}</Text>
        )}
        {problem && <Text accessibilityRole="alert">{problem}</Text>}
      </View>
      <Button
        label={t('correction.submit')}
        loading={busy}
        disabled={busy || !complete || !matches}
        onPress={() => onSubmit(lines as CorrectedLine[])}
      />
      <Text variant="caption" tone="secondary">
        {t('correction.noCashback')}
      </Text>
      <Button
        variant="ghost"
        label={t('scanImport.scanAgain')}
        disabled={busy}
        onPress={onCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[12], paddingBottom: spacing[24] },
  summary: {
    gap: spacing[4],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: radius[16],
    backgroundColor: colors.background,
  },
  row: {
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: radius[16],
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numbers: { flexDirection: 'row', gap: spacing[12] },
  number: { flex: 1 },
});
