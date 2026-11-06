import { StyleSheet, View } from 'react-native';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/** Permission preview: a receipt inside the same framing language as the camera. */
export function ScanPreview() {
  return (
    <View
      style={styles.canvas}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.frame}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        <ReceiptText
          size={layout.partnerMarkSize}
          color={colors.surface}
          strokeWidth={layout.iconStrokeWidth}
          {...decorativeSvgProps}
        />
        <View style={styles.line} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  canvas: {
    height: layout.artHeight,
    width: '100%',
    backgroundColor: premium.night,
    borderRadius: radius[24],
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: layout.artSmallHeight + spacing[32],
    height: layout.artSmallHeight + spacing[32],
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: spacing[32],
    height: spacing[32],
    borderColor: colors.brand.onDeep,
  },
  tl: {
    top: 0,
    left: 0,
    borderLeftWidth: layout.scanBracketWidth,
    borderTopWidth: layout.scanBracketWidth,
    borderTopLeftRadius: radius[12],
  },
  tr: {
    top: 0,
    right: 0,
    borderRightWidth: layout.scanBracketWidth,
    borderTopWidth: layout.scanBracketWidth,
    borderTopRightRadius: radius[12],
  },
  bl: {
    bottom: 0,
    left: 0,
    borderLeftWidth: layout.scanBracketWidth,
    borderBottomWidth: layout.scanBracketWidth,
    borderBottomLeftRadius: radius[12],
  },
  br: {
    bottom: 0,
    right: 0,
    borderRightWidth: layout.scanBracketWidth,
    borderBottomWidth: layout.scanBracketWidth,
    borderBottomRightRadius: radius[12],
  },
  line: {
    position: 'absolute',
    left: spacing[12],
    right: spacing[12],
    top: '50%',
    height: layout.scanLineWidth,
    backgroundColor: colors.brand.onDeep,
  },
});
