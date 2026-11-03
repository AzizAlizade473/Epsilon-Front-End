import { StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from '@/design';

/** A perforated seam: the recurring visual link between a purchase and its reward. */
export function ReceiptRule({ inverse = false }: { inverse?: boolean }) {
  return (
    <View
      accessible={false}
      style={[
        styles.rule,
        { borderColor: inverse ? colors.brand.onDeep : colors.border },
      ]}
    />
  );
}
const styles = StyleSheet.create({
  rule: {
    borderTopWidth: layout.borderWidth,
    borderStyle: 'dashed',
    marginVertical: spacing[8],
    width: '100%',
  },
});
