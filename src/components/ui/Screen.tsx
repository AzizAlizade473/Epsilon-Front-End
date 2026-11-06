import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ReactNode, type ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { Header, type HeaderProps } from './Header';
import { Text } from './Text';

import { colors, layout, spacing, theme, typography } from '@/design';
import { originalReceipts } from '@/design/original-receipts';
import { walletDesign } from '@/design/wallet';

export type ScreenProps = Pick<HeaderProps, 'leading' | 'trailing'> & {
  children: ReactNode;
  title?: string;
  scroll?: boolean;
  footer?: ReactNode;
  edges?: Edges;
  refreshControl?: ReactElement<RefreshControlProps>;
  surface?: 'background' | 'surface' | 'brandTint' | 'receiptCanvas' | 'wallet';
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  title,
  leading,
  trailing,
  scroll = true,
  footer,
  edges,
  refreshControl,
  surface = 'background',
  contentStyle,
}: ScreenProps) {
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(false);
  const titleHeight = useRef<number>(typography.title1.lineHeight);
  const content = (
    <>
      {scroll && title && (
        <View
          accessibilityElementsHidden={collapsed}
          importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
        >
          <Text
            variant="title1"
            accessibilityRole="header"
            onLayout={(event) => {
              titleHeight.current = event.nativeEvent.layout.height;
            }}
          >
            {title}
          </Text>
        </View>
      )}
      {children}
    </>
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor:
            surface === 'wallet'
              ? walletDesign.colors.canvas
              : surface === 'receiptCanvas'
                ? originalReceipts.colors.canvas
                : surface === 'brandTint'
                  ? colors.brand.tint
                  : colors[surface],
        },
      ]}
      edges={edges}
    >
      <StatusBar
        style={surface === 'wallet' ? 'light' : theme.statusBarStyle}
      />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {(title || leading || trailing) && (
          <Header
            title={title ?? ''}
            leading={leading}
            trailing={trailing}
            titleVisible={!scroll || collapsed}
          />
        )}
        {scroll ? (
          <ScrollView
            testID="screen-scroll"
            refreshControl={refreshControl}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={spacing[16]}
            onScroll={(event) => {
              const next =
                Boolean(title) &&
                event.nativeEvent.contentOffset.y >=
                  titleHeight.current + spacing[16];
              if (next !== collapsedRef.current) {
                collapsedRef.current = next;
                setCollapsed(next);
              }
            }}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill, contentStyle]}>
            {content}
          </View>
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
    gap: spacing[20],
  },
  footer: { ...column, padding: spacing.screenMargin },
});
