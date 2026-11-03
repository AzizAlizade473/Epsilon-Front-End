import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/design';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/navigation/BackButton';
import { Screen } from '@/components/ui/Screen';
export function ProfilePage({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const router = useRouter();
  return (
    <Screen
      title={title}
      footer={footer}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/profile')
          }
        />
      }
    >
      <View style={styles.content}>{children}</View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius[20],
    padding: spacing[20],
    gap: spacing[16],
  },
});
