import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';
import { layout, spacing, typography } from '@/design';

export function DetailRowSkeleton({
  leadingSize = layout.leadingIconSize,
}: {
  leadingSize?: number;
}) {
  return (
    <View style={styles.row}>
      <Skeleton width={leadingSize} height={leadingSize} />
      <View style={styles.copy}>
        <Skeleton width="70%" height={typography.body.lineHeight} />
        <Skeleton width="40%" height={typography.caption.lineHeight} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.detailRowHeight,
    gap: spacing[12],
    paddingVertical: spacing[12],
  },
  copy: { flex: 1, gap: spacing[4] },
});
