import { decorativeSvgProps } from '@/lib/decorative-svg';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { googleG } from '../../../../assets/brand/google-g';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';

// Apple logo glyph, Simple Icons (CC0).
const appleGlyph =
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.338 3.714 1.338.104 2.715-.688 3.625-1.701';

type SocialProps = {
  disabled?: boolean;
  onPress: () => void;
  loading?: boolean;
};

/** Outlined pill used for every third-party sign-in option. */
function SocialButton({
  label,
  mark,
  disabled,
  onPress,
  loading = false,
}: SocialProps & { label: string; mark: ReactNode }) {
  return (
    <PressSurface
      accessibilityLabel={label}
      disabled={disabled}
      loading={loading}
      onPress={onPress}
      style={styles.button}
      contentStyle={styles.content}
    >
      <View style={[styles.row, { opacity: loading ? 0 : 1 }]}>
        {mark}
        <Text variant="callout" style={styles.label}>
          {label}
        </Text>
      </View>
      {loading && (
        <ActivityIndicator color={colors.ink} style={StyleSheet.absoluteFill} />
      )}
    </PressSurface>
  );
}

export function GoogleButton(props: SocialProps) {
  const { t } = useTranslation();
  return (
    <SocialButton
      {...props}
      label={t('auth.continueGoogle')}
      mark={
        <SvgXml
          xml={googleG}
          width={spacing[20]}
          height={spacing[20]}
          {...decorativeSvgProps}
        />
      }
    />
  );
}

export function AppleButton(props: SocialProps) {
  const { t } = useTranslation();
  return (
    <SocialButton
      {...props}
      label={t('auth.continueApple')}
      mark={
        <Svg
          width={spacing[20]}
          height={spacing[20]}
          viewBox="0 0 24 24"
          {...decorativeSvgProps}
        >
          <Path d={appleGlyph} fill={colors.ink} />
        </Svg>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flexShrink: 1,
  },
  button: {
    borderRadius: radius.pill,
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  content: {
    minHeight: layout.searchHeight,
    flexDirection: 'row',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
  },
  label: { flexShrink: 1, textAlign: 'center' },
});
