import { useState } from 'react';
import { Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useAuthActions } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export function OnboardingLogout() {
  const { t } = useTranslation();
  const { logout } = useAuthActions();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        label={t('onboarding.logout')}
        onPress={() => setOpen(true)}
      />
      <Modal
        transparent
        visible={open}
        onRequestClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <Sheet
          onClose={() => {
            if (!busy) setOpen(false);
          }}
          accessibilityLabel={t('onboarding.logoutConfirm')}
        >
          <Text variant="title2" accessibilityRole="header">
            {t('onboarding.logoutConfirm')}
          </Text>
          <Button
            variant="destructive"
            label={t('onboarding.logout')}
            loading={busy}
            onPress={() => {
              if (busy) return;
              setBusy(true);
              void logout()
                .catch(() => toast(t('errors.generic')))
                .finally(() => {
                  setBusy(false);
                  setOpen(false);
                });
            }}
          />
          <Button
            variant="ghost"
            label={t('common.cancel')}
            disabled={busy}
            onPress={() => setOpen(false)}
          />
        </Sheet>
      </Modal>
    </>
  );
}
