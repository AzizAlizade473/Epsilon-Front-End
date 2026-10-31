import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
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
