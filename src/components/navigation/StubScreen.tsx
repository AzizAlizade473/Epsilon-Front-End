import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import type { NavigationTitle } from '@/lib/i18n';

export function createStubScreen(title: NavigationTitle, tab = false) {
  return function NavigationStub() {
    const { t } = useTranslation();
    return (
      <Screen
        title={t(`navigation.${title}`)}
        edges={tab ? ['top', 'left', 'right'] : undefined}
      >
        {null}
      </Screen>
    );
  };
}

export function createStubSheetScreen(title: NavigationTitle) {
  return function NavigationStubSheet() {
    const { t } = useTranslation();
    const router = useRouter();
    return (
      <Sheet onClose={() => router.back()}>
        <Header title={t(`navigation.${title}`)} />
      </Sheet>
    );
  };
}
