import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { colors, layout, spacing } from '@/design';

export type HeaderProps = {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  titleVisible?: boolean;
};

export function Header({
  title,
  leading,
  trailing,
  titleVisible = true,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      {leading}
      <View style={styles.title}>
        {titleVisible && (
          <Text variant="headline" accessibilityRole="header">
            {title}
          </Text>
        )}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.controlHeight,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing.screenMargin,
    paddingVertical: spacing[8],
    backgroundColor: colors.surface,
  },
  title: { flex: 1, minWidth: 0 },
});
