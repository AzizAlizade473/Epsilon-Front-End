import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';
import Store from 'lucide-react-native/icons/store';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { displayMerchantName } from '@/lib/brands';
import { formatDate } from '@/lib/date';
import { services } from '@/services';
import type { RestaurantReply } from '@/services/contracts';
import { generateIdempotencyKey } from '@/services/http/idempotency';

/** The restaurant's answer under the author's own review, with a report action. */
export function OfficialReply({
  feedbackId,
  reply,
}: {
  feedbackId: string;
  reply: RestaurantReply;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reported, setReported] = useState(false);
  const lock = useRef(false);
  // One key per report text, so a retry of the same report stays one report.
  const attempt = useRef<{ reason: string; key: string } | null>(null);
  const send = async () => {
    const text = reason.trim();
    if (lock.current || !text) return;
    lock.current = true;
    setBusy(true);
    setFailed(false);
    if (attempt.current?.reason !== text)
      attempt.current = {
        reason: text,
        key: generateIdempotencyKey('reply-report'),
      };
    try {
      await services.feedback.reportReply(feedbackId, text, {
        idempotencyKey: attempt.current.key,
      });
      setReported(true);
      setOpen(false);
    } catch {
      setFailed(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={styles.reply}>
      <View style={styles.heading}>
        <Icon
          icon={Store}
          size="small"
          color={colors.brand.primary}
          decorative
        />
        <View style={styles.copy}>
          <Text variant="callout" style={styles.name}>
            {displayMerchantName(reply.restaurantName)}
          </Text>
          <Text variant="caption" tone="secondary">
            {`${t('replies.official')} · ${formatDate(reply.updatedAt, { locale: i18n.language })}`}
          </Text>
        </View>
      </View>
      <Text>{reply.body}</Text>
      {reported ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {t('replies.reported')}
        </Text>
      ) : (
        <Button
          variant="ghost"
          label={t('replies.report')}
          onPress={() => setOpen(true)}
        />
      )}
      {open && (
        <Modal transparent visible onRequestClose={() => setOpen(false)}>
          <Sheet
            onClose={() => setOpen(false)}
            onBeforeClose={() => !lock.current}
            accessibilityLabel={t('replies.report')}
          >
            <View style={styles.sheet}>
              <Text variant="title2" accessibilityRole="header">
                {t('replies.reportTitle')}
              </Text>
              <Text tone="secondary">{t('replies.reportBody')}</Text>
              <Input
                label={t('replies.reason')}
                value={reason}
                onChangeText={setReason}
                maxLength={300}
                multiline
                editable={!busy}
                error={failed ? t('replies.reportError') : undefined}
              />
              <Button
                label={t('replies.send')}
                loading={busy}
                disabled={!reason.trim()}
                onPress={() => {
                  void send();
                }}
              />
              <Button
                variant="ghost"
                label={t('common.cancel')}
                disabled={busy}
                onPress={() => setOpen(false)}
              />
            </View>
          </Sheet>
        </Modal>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  reply: {
    gap: spacing[8],
    marginLeft: spacing[16],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.brand.primary },
  sheet: { gap: spacing[16] },
});
