import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { Header, type HeaderProps } from './Header';
import { Text } from './Text';

import { colors, layout, spacing, theme } from '@/design';

export type ScreenProps = Pick<HeaderProps, 'leading' | 'trailing'> & {
  children: ReactNode;
  title?: string;
  scroll?: boolean;
  footer?: ReactNode;
  edges?: Edges;
};

export function Screen({
  children,
  title,
  leading,
  trailing,
  scroll = true,
  footer,
  edges,
}: ScreenProps) {
  const content = (
    <>
      {scroll && title && (
        <Text variant="title1" accessibilityRole="header">
          {title}
        </Text>
      )}
      {children}
    </>
  );
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <StatusBar style={theme.statusBarStyle} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {(title || leading || trailing) && (
          <Header
            title={title ?? ''}
            leading={leading}
            trailing={trailing}
            titleVisible={!scroll}
          />
        )}
        {scroll ? (
          <ScrollView
            testID="screen-scroll"
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill]}>{content}</View>
        )}
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const column = {
  width: '100%',
  maxWidth: layout.contentMaxWidth,
  alignSelf: 'center',
} as const;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: {
    ...column,
    flexGrow: 1,
    padding: spacing.screenMargin,
    gap: spacing[16],
  },
  footer: { ...column, padding: spacing.screenMargin },
});
