import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import type { CaptureProblem, CaptureStatus } from '../hooks/useReceiptCapture';

const STEPS = ['reading', 'extracting', 'identifying'] as const;

/**
 * Controls shown over the live camera while a receipt is being captured: what to do
 * next, progress while it is read, and why a retake is needed. One camera session.
 */
export function ReceiptCaptureControls({
  status,
  problem,
  frames,
  onShutter,
  onRead,
  onRestart,
  onOfficial,
  onCancel,
}: {
  status: CaptureStatus;
  problem: CaptureProblem | null;
  frames: number;
  onShutter: () => void;
  onRead: () => void;
  onRestart: () => void;
  onOfficial: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  const fieldLabel = (field: string) => {
    const line = /^line (\d+)( total)?$/.exec(field);
    if (line)
      return t(
        line[2] ? 'scanImport.field.lineTotal' : 'scanImport.field.line',
        { n: Number(line[1]) },
      );
    return t(`scanImport.field.${field.replace(' ', '_')}`, {
      defaultValue: field,
    });
  };

  if (status === 'processing') return <Processing />;

  return (
    <View style={styles.panel}>
      <Text variant="headline" accessibilityLiveRegion="polite">
        {problem
          ? t(`capture.problem.${problem.key}`, {
              defaultValue: t(`scanImport.problem.${problem.key}`),
            })
          : t(frames ? 'capture.nextPart' : 'capture.showFull')}
      </Text>
      {problem && problem.fields.length > 0 && (
        <Text>
          {t('scanImport.unreadable', {
            fields: problem.fields.map(fieldLabel).join(', '),
          })}
        </Text>
      )}
      {frames > 0 && (
        <Text variant="caption" tone="secondary">
          {t('capture.photos', { count: frames })}
        </Text>
      )}
      <Button label={t('capture.shutter')} onPress={onShutter} />
      {frames > 0 && (
        <Button
          variant="secondary"
          label={t('capture.read')}
          onPress={onRead}
        />
      )}
      <View style={styles.row}>
        {frames > 0 && (
          <Button
            variant="ghost"
            label={t('capture.restart')}
            onPress={onRestart}
          />
        )}
        <Button
          variant="ghost"
          label={t('capture.official')}
          onPress={onOfficial}
        />
        <Button
          variant="ghost"
          label={t('scanImport.scanAgain')}
          onPress={onCancel}
        />
      </View>
    </View>
  );
}

/** Mounted only while a receipt is being read, so its steps start fresh each time. */
function Processing() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      2500,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <View style={styles.panel} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.brand.primary} />
      <Text variant="headline">{t('capture.qrDetected')}</Text>
      <Text>{t(`capture.step.${STEPS[step]}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[8],
    padding: spacing[16],
    borderRadius: radius[20],
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
});
