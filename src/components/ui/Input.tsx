import { useId, useState, type ComponentProps } from 'react';
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
  ...props
}: InputProps) {
  const labelId = useId();
  const [focused, setFocused] = useState(false);
  const disabled = !editable || readOnly;
  return (
    <View style={styles.group}>
      <Text nativeID={labelId} variant="callout">
        {label}
      </Text>
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
            backgroundColor: disabled ? colors.divider : colors.surface,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline
              ? typography.body.lineHeight * (props.numberOfLines ?? 3) +
                spacing[16] * 2
              : layout.controlHeight,
          },
        ]}
      />
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
    borderWidth: layout.hairlineWidth,
    borderRadius: radius[16],
  },
});
