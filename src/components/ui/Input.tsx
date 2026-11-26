import {
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Animated, Easing, StyleSheet, TextInput, View } from 'react-native';

import { Text } from './Text';

import { colors, layout, radius, spacing, typography } from '@/design';

export type InputProps = Omit<
  ComponentProps<typeof TextInput>,
  'style' | 'accessibilityLabel' | 'allowFontScaling' | 'maxFontSizeMultiplier'
> & {
  label: string;
  error?: string;
  hint?: string;
  /** `underline` is the auth-entry look: one rounded container holding icon/prefix and the text. */
  appearance?: 'boxed' | 'underline';
  leading?: ReactNode;
};

export function Input({
  label,
  error,
  hint,
  editable = true,
  readOnly = false,
  onFocus,
  onBlur,
  multiline,
  accessibilityHint,
  accessibilityState,
  appearance = 'boxed',
  leading,
  ...props
}: InputProps) {
  const underline = appearance === 'underline';
  const labelId = useId();
  const [focused, setFocused] = useState(false);
  const disabled = !editable || readOnly;
  const [focus] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(focus, {
      toValue: focused ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [focus, focused]);
  const edge = error ? colors.danger : colors.brand.primary;
  const rest = error ? colors.danger : colors.brand.border;
  return (
    <View style={styles.group}>
      <Text nativeID={labelId} variant="callout">
        {label}
      </Text>
      <Animated.View
        style={
          underline && [
            styles.container,
            {
              borderColor: focus.interpolate({
                inputRange: [0, 1],
                outputRange: [rest, edge],
              }),
              backgroundColor: disabled
                ? colors.divider
                : focus.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.surface, colors.surface],
                  }),
            },
          ]
        }
      >
        {underline && leading}
        <TextInput
          {...props}
          editable={editable}
          readOnly={readOnly}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityLabelledBy={labelId}
          accessibilityHint={error ?? hint ?? accessibilityHint}
          accessibilityState={{ ...accessibilityState, disabled }}
          allowFontScaling
          maxFontSizeMultiplier={0}
          selectionColor={colors.brand.primary}
          underlineColorAndroid={colors.transparent}
          placeholderTextColor={colors.inkSecondary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            {
              borderColor: error
                ? colors.danger
                : focused
                  ? colors.brand.primary
                  : colors.border,
              backgroundColor: disabled
                ? colors.divider
                : focused
                  ? colors.surface
                  : colors.background,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline
                ? typography.body.lineHeight * (props.numberOfLines ?? 3) +
                  spacing[16] * 2
                : layout.controlHeight,
            },
            underline && styles.bare,
          ]}
        />
      </Animated.View>
      {error ? (
        <Text
          variant="caption"
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : (
        hint && <Text variant="caption">{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[8] },
  input: {
    ...typography.body,
    color: colors.ink,
    minHeight: layout.controlHeight,
    padding: spacing[16],
    borderWidth: layout.borderWidth,
    borderRadius: radius[16],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    minHeight: layout.controlHeight,
    paddingHorizontal: spacing[16],
    borderWidth: layout.borderWidth * 1.5,
    borderRadius: radius[16],
  },
  bare: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    paddingVertical: spacing[12],
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    backgroundColor: colors.transparent,
  },
});
