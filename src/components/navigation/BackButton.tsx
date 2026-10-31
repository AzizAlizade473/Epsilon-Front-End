import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import X from 'lucide-react-native/icons/x';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/ui/IconButton';

export type BackButtonProps = {
  modal?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Screen-defined back/close button; uses Lucide stroke-2 icons and localized labels. */
export function BackButton({
  modal = false,
  onPress,
  accessibilityLabel,
}: BackButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const handlePress = onPress ?? (() => router.back());
  const label =
    accessibilityLabel ??
    (modal ? t('navigation.close') : t('navigation.back'));

  return (
    <IconButton
      icon={modal ? X : ArrowLeft}
      accessibilityLabel={label}
      onPress={handlePress}
    />
  );
}
