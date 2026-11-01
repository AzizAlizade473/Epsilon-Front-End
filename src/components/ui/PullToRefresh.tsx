import { RefreshControl, type RefreshControlProps } from 'react-native';
import { colors } from '@/design';
export function PullToRefresh(
  props: Pick<
    RefreshControlProps,
    'refreshing' | 'onRefresh' | 'enabled' | 'progressViewOffset' | 'testID'
  >,
) {
  return (
    <RefreshControl
      {...props}
      tintColor={colors.brand.primary}
      colors={[colors.brand.primary]}
      progressBackgroundColor={colors.surface}
    />
  );
}
