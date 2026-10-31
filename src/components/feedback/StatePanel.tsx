import { StyleSheet, View } from 'react-native';

import { Button, type ButtonProps } from '@/components/ui/Button';
import { Icon, type IconProps } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';

export type StatePanelProps = {
  icon: IconProps['icon'];
  title: string;
  message?: string;
  action?: ButtonProps;
  alert?: boolean;
};

export function StatePanel({
  icon,
  title,
  message,
  action,
  alert = false,
}: StatePanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.icon}>
        <Icon icon={icon} size="large" decorative />
      </View>
      <Text
        variant="title2"
        style={styles.copy}
        accessibilityRole={alert ? 'alert' : 'header'}
        accessibilityLiveRegion={alert ? 'polite' : 'none'}
      >
        {title}
      </Text>
      {message && (
        <Text tone="secondary" style={styles.copy}>
          {message}
        </Text>
      )}
      {action && <Button {...action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: spacing[24], gap: spacing[16] },
  icon: { alignSelf: 'center' },
  copy: { textAlign: 'center' },
});
