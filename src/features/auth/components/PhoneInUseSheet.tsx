import { Linking, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { env } from '@/lib/env';
import { useToast } from '@/providers/ToastProvider';

export function PhoneInUseSheet({
  visible,
  onEdit,
}: {
  visible: boolean;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onEdit}
      animationType="none"
    >
      <Sheet onClose={onEdit} accessibilityLabel={t('onboarding.phoneInUse')}>
        <Text variant="title2" accessibilityRole="header">
          {t('onboarding.phoneInUse')}
        </Text>
        <Button label={t('onboarding.otherPhone')} onPress={onEdit} />
        <Button
          variant="ghost"
          label={t('onboarding.contactSupport')}
          onPress={() => {
            void Linking.openURL(
              `mailto:${env.EXPO_PUBLIC_SUPPORT_EMAIL}`,
            ).catch(() => toast(t('errors.generic')));
          }}
        />
      </Sheet>
    </Modal>
  );
}
