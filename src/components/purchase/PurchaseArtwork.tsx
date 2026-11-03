import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '@/design';
import { purchaseDesign as p } from '@/design/purchase';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/** Purchase proof, a plate and a verification seal. No encoded claim or financial data. */
export function PurchaseArtwork({
  kind = 'scan',
}: {
  kind?: 'scan' | 'dish' | 'success';
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={
        kind === 'scan'
          ? styles.scan
          : kind === 'dish'
            ? styles.dish
            : styles.success
      }
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 180 180"
        {...decorativeSvgProps}
      >
        {kind === 'scan' ? (
          <>
            <G transform="rotate(11 90 90)">
              <Path
                d="M35 12H133L149 28V158L139 152L129 158L119 152L109 158L99 152L89 158L79 152L69 158L59 152L49 158L35 152Z"
                fill={colors.surface}
              />
              <Path d="M133 12V29H149" fill={colors.brand.onDeep} />
              <Path
                d="M52 43H125M52 55H107M52 69H125"
                stroke={colors.brand.border}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <Path
                d="M50 83H132"
                stroke={colors.brand.border}
                strokeDasharray="3 4"
              />
              <G stroke={colors.brand.primary} strokeWidth="3" fill="none">
                <Rect x="54" y="95" width="13" height="13" />
                <Rect x="83" y="95" width="13" height="13" />
                <Rect x="54" y="123" width="13" height="13" />
                <Path d="M82 123H96V137H83V130H91M54 115H76V95M103 95H120M104 104H120M103 117H120M103 128H114" />
              </G>
            </G>
            <Path
              d="M17 48V27H38M139 31H164V56M19 130V153H39M144 153H166V129"
              stroke={colors.brand.onDeep}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M12 91H169"
              stroke={colors.brand.secondary}
              strokeWidth="2"
            />
          </>
        ) : kind === 'dish' ? (
          <>
            <Circle
              cx="87"
              cy="90"
              r="65"
              fill={colors.surface}
              stroke={colors.brand.border}
              strokeWidth="2"
            />
            <Circle
              cx="87"
              cy="90"
              r="49"
              fill="none"
              stroke={colors.brand.primary}
              strokeWidth="2"
            />
            <Path
              d="M10 40V73Q10 89 23 89V143M23 40V75M36 40V73Q36 89 23 89M158 40V143M158 40Q135 57 143 91H158"
              fill="none"
              stroke={colors.brand.primary}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <Path
              d="m75 88 9 9 17-20"
              fill="none"
              stroke={colors.brand.secondary}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <Path
              d="m90 7 13 8 16-1 9 13 15 5 4 16 13 10-2 16 8 14-8 14 2 16-13 10-4 16-15 5-9 13-16-1-13 8-13-8-16 1-9-13-15-5-4-16-13-10 2-16-8-14 8-14-2-16 13-10 4-16 15-5 9-13 16 1Z"
              fill={colors.brand.primary}
            />
            <Circle
              cx="90"
              cy="88"
              r="57"
              fill="none"
              stroke={colors.brand.onDeep}
              strokeWidth="1"
              strokeDasharray="2 5"
            />
            <Path
              d="m62 88 19 19 39-43"
              stroke={colors.surface}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        )}
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({
  scan: { width: p.scanArtWidth, height: p.artHeight },
  dish: { width: p.dishSize, height: p.dishSize },
  success: { width: p.stampSize, height: p.stampSize },
});
