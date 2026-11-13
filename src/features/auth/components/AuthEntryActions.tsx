import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, spacing } from '@/design';
import { env } from '@/lib/env';
import { AppleButton, GoogleButton } from './GoogleButton';

export type AuthIntent = 'login' | 'register';

export function AuthEntrySwitch({
  intent,
  disabled,
}: {
  intent: AuthIntent;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const target = intent === 'login' ? 'register' : 'login';
  return (
    <View style={styles.switch}>
      <Text variant="callout">
        {t(intent === 'login' ? 'authEntry.noAccount' : 'authEntry.hasAccount')}
      </Text>
      <PressSurface
        accessibilityRole="link"
        accessibilityLabel={t(`authEntry.${target}`)}
        disabled={disabled}
        onPress={() =>
          router.replace(target === 'register' ? '/register' : '/login')
        }
        contentStyle={styles.link}
      >
        <Text variant="callout" style={styles.linkText}>
          {t(`authEntry.${target}`)}
        </Text>
      </PressSurface>
    </View>
  );
}

export function GoogleEntry({
  busy,
  loading,
  error,
  onPress,
  onApple,
}: {
  busy: boolean;
  loading: boolean;
  error?: string;
  onPress: () => void;
  /** Apple stays hidden until a native flow exists and the flag allows it (iOS only). */
  onApple?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.group}>
      <GoogleButton
        disabled={busy || !env.ENABLE_GOOGLE_SIGNIN || Platform.OS === 'web'}
        loading={loading}
        onPress={onPress}
      />
      {(!env.ENABLE_GOOGLE_SIGNIN || Platform.OS === 'web') && (
        <Text variant="caption">
          {t(
            Platform.OS === 'web'
              ? 'authFlow.googleNativeOnly'
              : 'authFlow.googleSetupRequired',
          )}
        </Text>
      )}
      {error && (
        <Text
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      {onApple && env.ENABLE_APPLE_SIGNIN && Platform.OS === 'ios' && (
        <AppleButton disabled={busy} onPress={onApple} />
      )}
      <View style={styles.separator}>
        <View style={styles.line} />
        <Text variant="caption" style={styles.or}>
          {t('auth.or')}
        </Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[12] },
  separator: { flexDirection: 'row', alignItems: 'center', gap: spacing[16] },
  or: { textTransform: 'uppercase', letterSpacing: 1 },
  line: {
    height: layout.hairlineWidth,
    backgroundColor: colors.border,
    flex: 1,
  },
  switch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: { paddingHorizontal: spacing[8], paddingVertical: spacing[8] },
  linkText: { color: colors.brand.secondary, fontWeight: '600' },
});
