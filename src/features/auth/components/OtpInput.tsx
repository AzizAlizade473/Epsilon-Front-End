import { useRef, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';

export function OtpInput({
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <View style={[styles.root, disabled && styles.disabled]}>
      <Pressable accessible={false} onPress={() => input.current?.focus()}>
        <View
          style={styles.boxes}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor: invalid
                    ? colors.danger
                    : index === value.length
                      ? colors.brand.primary
                      : colors.border,
                },
              ]}
            >
              <Text variant="title2">{value[index] ?? ''}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      <TextInput
        ref={input}
        value={value}
        autoFocus
        editable={!disabled}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        accessibilityLabel={t('auth.codeLabel')}
        accessibilityHint={invalid ? t('auth.otpInvalid') : t('auth.codeHint')}
        accessibilityState={{ disabled }}
        caretHidden
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  disabled: { opacity: layout.otpBusyOpacity },
  boxes: { flexDirection: 'row', gap: spacing[4] },
  box: {
    flex: 1,
    maxWidth: spacing[48],
    minHeight: layout.controlHeight,
    borderWidth: layout.hairlineWidth,
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
  },
  input: { ...StyleSheet.absoluteFill, opacity: 0, color: colors.transparent },
});
