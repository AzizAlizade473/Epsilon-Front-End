import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, TextInput, View } from 'react-native';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import X from 'lucide-react-native/icons/x';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
  useMotion,
} from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';

const HEIGHT = 52;

/** Search and the way into filters, as one control row. */
export function BillSearch({
  value,
  onChange,
  activeFilters,
  onFilters,
}: {
  value: string;
  onChange: (value: string) => void;
  activeFilters: number;
  onFilters: () => void;
}) {
  const { t } = useTranslation();
  const { reduceMotion } = useMotion();
  const [focused, setFocused] = useState(false);
  const [focus] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(focus, {
      toValue: focused ? 1 : 0,
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [focus, focused, reduceMotion]);
  const label = activeFilters
    ? t('bills.filtersActive', { count: activeFilters })
    : t('bills.filters');
  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.field,
          {
            borderColor: focus.interpolate({
              inputRange: [0, 1],
              outputRange: [o.colors.emptyStar, colors.brand.primary],
            }),
          },
        ]}
      >
        <Icon
          icon={Search}
          size="small"
          color={focused ? colors.brand.primary : o.colors.secondary}
          decorative
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={t('bills.search')}
          placeholder={t('bills.searchPlaceholder')}
          placeholderTextColor={o.colors.secondary}
          maxLength={80}
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={colors.brand.primary}
          underlineColorAndroid={colors.transparent}
          maxFontSizeMultiplier={1.6}
          style={styles.input}
        />
        {value.length > 0 && (
          <IconButton
            icon={X}
            accessibilityLabel={t('bills.clearSearch')}
            onPress={() => onChange('')}
          />
        )}
      </Animated.View>
      <PressSurface
        accessibilityLabel={label}
        onPress={onFilters}
        spring
        style={[styles.button, activeFilters > 0 && styles.buttonActive]}
        contentStyle={styles.buttonContent}
      >
        <Icon
          icon={SlidersHorizontal}
          color={activeFilters ? colors.surface : colors.brand.primary}
          decorative
        />
        {activeFilters > 0 && <Text style={styles.count}>{activeFilters}</Text>}
      </PressSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  field: {
    flex: 1,
    minWidth: 0,
    minHeight: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingLeft: spacing[16],
    paddingRight: spacing[4],
    borderRadius: radius[16],
    borderWidth: layout.borderWidth * 1.5,
    backgroundColor: o.colors.surface,
  },
  input: {
    ...typography.callout,
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing[12],
    color: o.colors.ink,
  },
  button: {
    minWidth: HEIGHT,
    height: HEIGHT,
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
    overflow: 'hidden',
  },
  buttonActive: { backgroundColor: colors.brand.primary },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    height: HEIGHT,
    paddingHorizontal: spacing[12],
  },
  count: { ...o.type.product, color: colors.surface },
});
