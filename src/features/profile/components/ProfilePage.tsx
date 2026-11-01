import type { ReactNode } from 'react';
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
      {children}
    </Screen>
  );
}
