import Wallet from 'lucide-react-native/icons/wallet';
import { StyleSheet, View } from 'react-native';

import type { GalleryCopy } from './galleryCopy';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Toast } from '@/components/feedback/Toast';
import { Amount } from '@/components/ui/Amount';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { layout, spacing } from '@/design';

/** Sample amounts live only in the development gallery, never in product data. */
export function GalleryFeedback({
  copy,
  visible,
  onShow,
  onDismiss,
}: {
  copy: GalleryCopy;
  visible: boolean;
  onShow: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text variant="title2" accessibilityRole="header">
        {copy.amount}
      </Text>
      <Amount minor={1250} />
      <Amount minor={320} sign="always" variant="title1" />
      <Amount minor={-320} variant="title2" />
      <Text variant="title2" accessibilityRole="header">
        {copy.feedback}
      </Text>
      <Skeleton
        width="100%"
        height={layout.controlHeight}
        accessibilityLabel={copy.loadingLabel}
      />
      <EmptyState
        icon={Wallet}
        title={copy.emptyTitle}
        message={copy.emptyMessage}
      />
      <ErrorState
        title={copy.errorTitle}
        message={copy.errorMessage}
        retryLabel={copy.retry}
        onRetry={onShow}
      />
      <Button label={copy.showToast} variant="secondary" onPress={onShow} />
      <Toast
        visible={visible}
        message={copy.toastMessage}
        dismissLabel={copy.dismiss}
        onDismiss={onDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: spacing[16] } });
