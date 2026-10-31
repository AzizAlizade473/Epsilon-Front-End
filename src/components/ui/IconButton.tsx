import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Icon, type IconProps } from './Icon';
import { PressSurface, type PressSurfaceProps } from './PressSurface';

import { colors, layout, radius } from '@/design';

export type IconButtonProps = Pick<
  PressSurfaceProps,
  'accessibilityLabel' | 'onPress' | 'disabled' | 'loading'
> & {
  icon: IconProps['icon'];
  tone?: 'default' | 'inverse';
};

export function IconButton({
  icon,
  loading = false,
  tone = 'default',
  ...props
}: IconButtonProps) {
  const color = tone === 'inverse' ? colors.surface : colors.ink;
  return (
    <PressSurface
      {...props}
      loading={loading}
      style={styles.button}
      pressedColor={tone === 'inverse' ? colors.inkSecondary : colors.divider}
    >
      <View style={{ opacity: loading ? 0 : 1 }}>
        <Icon icon={icon} color={color} decorative />
      </View>
      {loading && (
        <ActivityIndicator color={color} style={StyleSheet.absoluteFill} />
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
