import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { env } from '@/lib/env';
import { useToast } from '@/providers/ToastProvider';
import { ProfilePage } from '../components/ProfilePage';
import { colors, layout, motionTokens, spacing } from '@/design';

function Question({
  title,
  answer,
  expanded,
  onPress,
}: {
  title: string;
  answer: string;
  expanded: boolean;
  onPress: () => void;
}) {
  const turn = useSharedValue(expanded ? 1 : 0);
  useEffect(() => {
    turn.set(
      withTiming(expanded ? 1 : 0, {
        duration: motionTokens.duration.normal,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [expanded, turn]);
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 180}deg` }],
  }));
  return (
    <View style={styles.item}>
      <PressSurface
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        onPress={onPress}
        contentStyle={styles.row}
        pressedColor={colors.divider}
      >
        <Text variant="callout" style={styles.title}>
          {title}
        </Text>
        <Animated.View style={arrow}>
          <Icon icon={ChevronDown} size="small" decorative />
        </Animated.View>
      </PressSurface>
      {expanded && <Text tone="secondary">{answer}</Text>}
    </View>
  );
}

export default function HelpScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [expanded, setExpanded] = useState<number>();
  return (
    <ProfilePage title={t('profile.help')}>
      {[1, 2, 3, 4].map((id) => (
        <Question
          key={id}
          title={t(`profile.faq.${id}.question`)}
          answer={t(`profile.faq.${id}.answer`)}
          expanded={expanded === id}
          onPress={() => setExpanded(expanded === id ? undefined : id)}
        />
      ))}
      <Button
        label={t('profile.contact')}
        onPress={() => {
          void Linking.openURL(`mailto:${env.EXPO_PUBLIC_SUPPORT_EMAIL}`).catch(
            () => toast(t('errors.generic')),
          );
        }}
      />
    </ProfilePage>
  );
}
const styles = StyleSheet.create({
  item: {
    gap: spacing[8],
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing[8],
  },
  row: {
    minHeight: layout.rowHeight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
    paddingVertical: spacing[12],
  },
  title: { flex: 1 },
});
