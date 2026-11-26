import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import type { User } from '@/services';
import { ReauthPanel } from './ReauthPanel';

/** Shown when the server answers REAUTH_REQUIRED to a contact change. */
export function ReauthSheet({
  user,
  onVerified,
  onClose,
}: {
  user: User;
  onVerified: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  // Not closable mid-request: a late success would repeat a change just cancelled.
  const lock = useRef(false);
  const close = () => {
    if (!lock.current) onClose();
  };
  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Sheet
        onClose={onClose}
        onBeforeClose={() => !lock.current}
        accessibilityLabel={t('contact.reauthTitle')}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={{ gap: spacing[16] }}>
            <Text variant="title2" accessibilityRole="header">
              {t('contact.reauthTitle')}
            </Text>
            <ReauthPanel
              user={user}
              onVerified={onVerified}
              onBusyChange={(value) => {
                lock.current = value;
                setBusy(value);
              }}
            />
            <Button
              variant="ghost"
              label={t('common.cancel')}
              disabled={busy}
              onPress={close}
            />
          </View>
        </ScrollView>
      </Sheet>
    </Modal>
  );
}
