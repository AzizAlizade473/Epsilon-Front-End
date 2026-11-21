import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from './Text';

import { colors, layout, radius, spacing, typography } from '@/design';

export type InputProps = Omit<
  ComponentProps<typeof TextInput>,
  'style' | 'accessibilityLabel' | 'allowFontScaling' | 'maxFontSizeMultiplier'
> & {
  label: string;
  error?: string;
  hint?: string;
  /** `underline` is the auth-entry look: no box, icon/prefix row on a bottom rule. */
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
  return (
    <View style={styles.group}>
      <Text nativeID={labelId} variant="callout">
        {label}
      </Text>
      <View
        style={
          underline && [
            styles.underline,
            {
              borderBottomColor: error
                ? colors.danger
                : focused
                  ? colors.brand.primary
                  : colors.brand.border,
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
      </View>
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
  underline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    borderBottomWidth: layout.borderWidth * 1.5,
  },
  bare: {
    flex: 1,
    minWidth: 0,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    backgroundColor: colors.transparent,
  },
});
