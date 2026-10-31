import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Icon, type IconProps } from './Icon';
import { PressSurface, type PressSurfaceProps } from './PressSurface';

import { colors, layout, radius } from '@/design';

export type IconButtonProps = Pick<
  PressSurfaceProps,
  'accessibilityLabel' | 'onPress' | 'disabled' | 'loading'
> & {
  icon: IconProps['icon'];
};

export function IconButton({
  icon,
  loading = false,
  ...props
}: IconButtonProps) {
  return (
    <PressSurface
      {...props}
      loading={loading}
      style={styles.button}
      pressedColor={colors.divider}
    >
      <View style={{ opacity: loading ? 0 : 1 }}>
        <Icon icon={icon} decorative />
      </View>
      {loading && (
        <ActivityIndicator color={colors.ink} style={StyleSheet.absoluteFill} />
      )}
    </PressSurface>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.tapTarget,
    minHeight: layout.tapTarget,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
