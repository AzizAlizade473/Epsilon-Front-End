import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconProps } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';

import { colors, layout, radius, spacing } from '@/design';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconProps['icon'];
  onPress?: () => void;
  disabled?: boolean;
  divider?: boolean;
  accessibilityLabel?: string;
};

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  onPress,
  disabled,
  divider = true,
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <>
      {icon && (
        <View style={styles.leading}>
          <Icon icon={icon} decorative />
        </View>
      )}
      <View style={styles.text}>
        <Text>{title}</Text>
        {subtitle && (
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="callout" style={styles.value}>
          {value}
        </Text>
      )}
      {onPress && <Icon icon={ChevronRight} size="small" decorative />}
    </>
  );
  return (
    <View>
      {onPress ? (
        <PressSurface
          accessibilityLabel={
            accessibilityLabel ??
            [title, subtitle, value].filter(Boolean).join(', ')
          }
          onPress={onPress}
          disabled={disabled}
          contentStyle={styles.row}
          pressedColor={colors.divider}
        >
          {content}
        </PressSurface>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
      {divider && (
        <View
          style={[
            styles.divider,
            icon && { marginLeft: layout.leadingIconSize + spacing[12] },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[12],
  },
  text: { flex: 1, minWidth: 0, gap: spacing[4] },
  value: { flexShrink: 1, textAlign: 'right' },
  leading: {
    width: layout.leadingIconSize,
    height: layout.leadingIconSize,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: layout.hairlineWidth, backgroundColor: colors.border },
});
