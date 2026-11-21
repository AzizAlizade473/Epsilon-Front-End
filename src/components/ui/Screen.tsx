import { StatusBar } from 'expo-status-bar';
import {
  useContext,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { Header, type HeaderProps } from './Header';
import { useKeyboardReveal } from '@/hooks/useKeyboardReveal';
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
  /** false when the screen pads for the floating tab bar inside its own surface. */
  tabInset?: boolean;
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
  tabInset = true,
}: ScreenProps) {
  const [collapsed, setCollapsed] = useState(false);
  // The tab bar floats over content; reserve its height so nothing hides under it.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const floatInset =
    tabInset && tabBarHeight
      ? { paddingBottom: tabBarHeight + spacing[16] }
      : null;
  const collapsedRef = useRef(false);
  const titleHeight = useRef<number>(typography.title1.lineHeight);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const trackOffset = useKeyboardReveal(scrollRef, scroll);
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
        // Android is edge-to-edge (window no longer resizes), so pad there too.
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
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
            ref={scrollRef}
            refreshControl={refreshControl}
            contentContainerStyle={[styles.content, contentStyle, floatInset]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={spacing[16]}
            onScroll={(event) => {
              trackOffset(event);
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
          <View style={[styles.content, styles.fill, contentStyle, floatInset]}>
            {content}
          </View>
        )}
        {footer && <View style={[styles.footer, floatInset]}>{footer}</View>}
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
