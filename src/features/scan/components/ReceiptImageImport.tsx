import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { services, type Receipt } from '@/services';
import { isApiError } from '@/services/http/errors';
import type { FiscalImport } from '@/services/contracts';

const OFFICIAL_ORIGIN = 'https://monitoring.e-kassa.gov.az/';
const MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type Mime = (typeof MIMES)[number];

/** The official receipt page for a scanned fiscal QR, or null for anything else. */
export function officialReceiptUrl(qr: string): string | null {
  // Some registers pad the QR text with NUL bytes.
  const text = qr.replace(/\u0000+$/, '').trim();
  return text.startsWith(OFFICIAL_ORIGIN) && !/\s/.test(text) ? text : null;
}

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
 * Completes a scanned fiscal QR when no official data source can be queried:
 * the customer opens the official receipt themselves and imports its image, or
 * photographs the paper receipt. The server reads the image; this screen only
 * sends it and shows what came back. Nothing is read from other apps.
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
  const official = officialReceiptUrl(qr);

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

  const photograph = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setProblem({ key: 'camera', fields: [] });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      // Lets the customer crop to the receipt before it is sent.
      allowsEditing: true,
    });
    if (!result.canceled) await send('paper_photo', result.assets);
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
      {official && (
        <Button
          variant="secondary"
          label={t('scanImport.openOfficial')}
          disabled={busy}
          onPress={() => void Linking.openURL(official)}
        />
      )}
      <Button
        label={t(busy ? 'scanImport.reading' : 'scanImport.importImage')}
        loading={busy}
        disabled={busy}
        onPress={() => void importImage()}
      />
      <Button
        variant="secondary"
        label={t('scanImport.photograph')}
        disabled={busy}
        onPress={() => void photograph()}
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
