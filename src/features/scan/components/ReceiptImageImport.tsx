import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { services, type Receipt } from '@/services';
import { isApiError } from '@/services/http/errors';
import type { FiscalImport } from '@/services/contracts';

const MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type Mime = (typeof MIMES)[number];

export { officialReceiptUrl } from '../ekassa/exportBridge';

const problemKeys: Record<string, string> = {
  RECEIPT_IMAGE_INCOMPLETE: 'incomplete',
  RECEIPT_IMAGE_MISMATCH: 'mismatch',
  RECEIPT_READER_UNAVAILABLE: 'unavailable',
  RECEIPT_READER_QUOTA: 'quota',
  NETWORK: 'network',
  TIMEOUT: 'network',
};

type Problem = { key: string; fields: readonly string[] };

/**
 * Recovery only, when the automatic import from the official page did not work: the
 * customer picks the official receipt image they saved. The server reads it; this
 * component only sends it and shows what came back.
 */
export function ReceiptImageImport({
  qr,
  onImported,
  onScanAgain,
}: {
  qr: string;
  onImported: (receipt: Receipt) => void;
  onScanAgain: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const send = async (
    source: FiscalImport['source'],
    assets: ImagePicker.ImagePickerAsset[],
  ) => {
    const images = assets.slice(0, 4).map((a) => ({
      mime: (a.mimeType ?? 'image/jpeg') as Mime,
      data: a.base64 ?? '',
    }));
    if (images.some((i) => !MIMES.includes(i.mime) || !i.data)) {
      setProblem({ key: 'format', fields: [] });
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      onImported(
        await services.receipt.importFiscalImage({ qr, source, images }),
      );
    } catch (cause) {
      setProblem({
        key: problemKeys[isApiError(cause) ? cause.code : ''] ?? 'unknown',
        fields: isApiError(cause) ? cause.fields : [],
      });
    } finally {
      setBusy(false);
    }
  };

  const importImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      base64: true,
      quality: 0.85,
    });
    if (!result.canceled) await send('official_page', result.assets);
  };

  const fieldLabel = (field: string) => {
    const line = /^line (\d+)( total)?$/.exec(field);
    if (line)
      return t(
        line[2] ? 'scanImport.field.lineTotal' : 'scanImport.field.line',
        {
          n: Number(line[1]),
        },
      );
    return t(`scanImport.field.${field.replace(' ', '_')}`, {
      defaultValue: field,
    });
  };

  return (
    <View style={styles.root}>
      <Text variant="title2" accessibilityRole="header">
        {t('scanImport.title')}
      </Text>
      <Text>{t('scanImport.body')}</Text>
      {problem && (
        <View style={styles.problem} accessibilityLiveRegion="polite">
          <Text variant="headline">
            {t(`scanImport.problem.${problem.key}`)}
          </Text>
          {problem.fields.length > 0 && (
            <Text>
              {t('scanImport.unreadable', {
                fields: problem.fields.map(fieldLabel).join(', '),
              })}
            </Text>
          )}
        </View>
      )}
      <Button
        label={t(busy ? 'scanImport.reading' : 'scanImport.importImage')}
        loading={busy}
        disabled={busy}
        onPress={() => void importImage()}
      />
      <Text variant="caption" tone="secondary">
        {t('scanImport.trust')}
      </Text>
      <Button
        variant="ghost"
        label={t('scanImport.scanAgain')}
        disabled={busy}
        onPress={onScanAgain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[12] },
  problem: {
    gap: spacing[4],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.warningTint,
  },
});
