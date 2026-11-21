import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { colors, layout } from '@/design';

// Owner-supplied artwork (transparent). Gradient original on light surfaces, white on dark.
const wordmark = require('../../../assets/brand/epsilon-wordmark.webp');
const WORDMARK_RATIO = 2000 / 509;

export function Brand({ inverse = false }: { inverse?: boolean }) {
  const { t } = useTranslation();
  return (
    <View accessible accessibilityLabel={t('auth.brand')}>
      <Image
        source={wordmark}
        style={{
          width: layout.wordmarkHeight * WORDMARK_RATIO,
          height: layout.wordmarkHeight,
        }}
        contentFit="contain"
        tintColor={inverse ? colors.surface : undefined}
        accessible={false}
      />
    </View>
  );
}

const mark = require('../../../assets/brand/logo-mark-white.png');

/** Official "E" monogram (owner-supplied artwork), white with transparency; tinted on light surfaces. */
export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  const { t } = useTranslation();
  return (
    <View accessible accessibilityLabel={t('auth.brand')}>
      <Image
        source={mark}
        style={{
          width: layout.brandMarkSize * (296 / 242),
          height: layout.brandMarkSize,
        }}
        contentFit="contain"
        tintColor={inverse ? undefined : colors.brand.primary}
        accessible={false}
      />
    </View>
  );
}
