import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors, layout } from '@/design';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/** Original paper receipt + plate composition. Illustration only; no fabricated data. */
export function ReceiptArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.art, compact && styles.compact]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 248"
        {...decorativeSvgProps}
      >
        <Circle cx="218" cy="126" r="98" fill={colors.brand.border} />
        <Circle cx="218" cy="126" r="76" fill={colors.surface} />
        <Circle
          cx="218"
          cy="126"
          r="58"
          fill="none"
          stroke={colors.brand.border}
          strokeWidth="2"
        />
        <Path
          d="M273 45v40m8-40v40m8-40v40m-16-8q8 18 16 0m-8 10v98"
          fill="none"
          stroke={colors.brand.deep}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <G transform="rotate(-9 135 125)">
          <Path
            d="M62 28H205V211L193 220L181 211L169 220L157 211L145 220L133 211L121 220L109 211L97 220L85 211L73 220L62 211Z"
            fill={colors.surface}
            stroke={colors.brand.deep}
            strokeWidth="2"
          />
          <Path
            d="M83 66H182M83 85H163M83 106H182"
            stroke={colors.brand.border}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M78 129H189"
            stroke={colors.brand.border}
            strokeWidth="2"
            strokeDasharray="4 5"
          />
          <G fill={colors.brand.primary}>
            <Path d="m97 149 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" />
            <Path d="m132 149 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" />
            <Path d="m167 149 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" />
          </G>
          <Path
            d="M83 192H112M119 192H148M155 192H182"
            stroke={colors.brand.border}
            strokeWidth="3"
          />
        </G>
        <Rect
          x="206"
          y="153"
          width="70"
          height="62"
          rx="20"
          fill={colors.brand.primary}
        />
        <Path
          d="m226 183 10 10 22-24"
          fill="none"
          stroke={colors.surface}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({
  art: { width: '100%', height: layout.artHeight },
  compact: { height: layout.artSmallHeight },
});
