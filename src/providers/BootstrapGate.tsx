import * as Splash from 'expo-splash-screen';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import az from '../../locales/az.json';

import { RuntimeProviders } from './RuntimeProviders';

import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { colors, layout, spacing } from '@/design';
import { bootStorage, type BootData } from '@/lib/bootstrap';
import { i18n, initializeI18n } from '@/lib/i18n';
import { initializeServices } from '@/services';

async function loadBootData(): Promise<BootData> {
  const [, boot] = await Promise.all([
    initializeI18n(),
    bootStorage.read(),
    initializeServices(),
  ]);
  return boot;
}

export function BootstrapGate({
  children,
  load = loadBootData,
}: {
  children: ReactNode;
  load?: () => Promise<BootData>;
}) {
  const [boot, setBoot] = useState<BootData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const consumeBoot = useCallback(() => {
    setBoot((previous) =>
      previous?.session ? { ...previous, session: null } : previous,
    );
  }, []);
  useEffect(() => {
    let active = true;
    void load()
      .then((value) => {
        if (active) setBoot(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);
  const status = boot ? 'ready' : failed ? 'error' : 'loading';
  const title = i18n.t('navigation.error', az.navigation.error);
  const retry = i18n.t('navigation.retry', az.navigation.retry);
  return (
    <View
      key={status}
      testID="boot-layout"
      style={styles.root}
      onLayout={() => {
        if (status !== 'loading')
          void Splash.hideAsync().catch(() => undefined);
      }}
    >
      {boot ? (
        <RuntimeProviders boot={boot} onBootConsumed={consumeBoot}>
          {children}
        </RuntimeProviders>
      ) : failed ? (
        <ErrorState
          title={title}
          retryLabel={retry}
          onRetry={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        />
      ) : (
        <View style={styles.loading}>
          <Skeleton
            width="100%"
            height={layout.controlHeight}
            accessibilityLabel={az.navigation.loading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loading: { padding: spacing.screenMargin },
});
