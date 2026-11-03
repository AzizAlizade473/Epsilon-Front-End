import ArrowDownLeft from 'lucide-react-native/icons/arrow-down-left';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Clock from 'lucide-react-native/icons/clock';
import { View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { colors, layout, radius } from '@/design';
import type { WalletTransaction } from '@/services/contracts';
const icons = {
  earned: ArrowDownLeft,
  redeemed: ArrowUpRight,
  reversed: RotateCcw,
  expired: Clock,
};
const backgrounds = {
  earned: colors.successTint,
  redeemed: colors.brand.tint,
  reversed: colors.warningTint,
  expired: colors.divider,
};
export function TransactionTypeIcon({
  type,
  detail = false,
}: {
  type: WalletTransaction['type'];
  detail?: boolean;
}) {
  const size = detail ? layout.controlHeight : layout.leadingIconSize;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius[16],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: backgrounds[type],
      }}
    >
      <Icon icon={icons[type]} decorative size={detail ? 'large' : 'medium'} />
    </View>
  );
}
