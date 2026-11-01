import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Linking } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ErrorState } from './ErrorState';
import { requiresAppUpdate } from '@/lib/app-version';
import { services } from '@/services';
import { queryKeys } from '@/services/query';
import { isApiError } from '@/services/http/errors';
import { useToast } from '@/providers/ToastProvider';
import packageJson from '../../../package.json';
export function UpdateGate({
  children,
  currentVersion = Constants.expoConfig?.version ?? packageJson.version,
  storePackage = Constants.expoConfig?.android?.package,
}: {
  children: ReactNode;
  currentVersion?: string;
  storePackage?: string;
}) {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const query = useQuery({
    gcTime: 0,
    queryKey: queryKeys.config.current(),
    queryFn: ({ signal }) => services.config.get({ signal }),
    enabled: ready,
  });
  const required = Boolean(
    query.data && requiresAppUpdate(currentVersion, query.data.minAppVersion),
  );
  useEffect(() => {
    if (!required) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, [required]);
  if (required)
    return (
      <Screen scroll={false} title={t('resilience.updateTitle')}>
        <Text>{t('resilience.updateBody')}</Text>
        <Button
          label={t('resilience.updateAction')}
          onPress={() => {
            if (
              !storePackage ||
              !/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+$/.test(storePackage)
            ) {
              toast(t('errors.generic'));
              return;
            }
            void Linking.openURL(
              `https://play.google.com/store/apps/details?id=${encodeURIComponent(storePackage)}`,
            ).catch(() => toast(t('errors.generic')));
          }}
        />
      </Screen>
    );
  if (
    !query.data &&
    query.isError &&
    isApiError(query.error) &&
    query.error.code === 'BAD_RESPONSE'
  )
    return (
      <Screen scroll={false}>
        <ErrorState
          title={t('errors.generic')}
          retryLabel={t('common.retry')}
          loading={query.isFetching}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  return children;
}
