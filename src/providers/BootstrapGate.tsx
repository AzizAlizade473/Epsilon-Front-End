import * as Splash from 'expo-splash-screen';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import az from '../../locales/az.json';

import { RuntimeProviders } from './RuntimeProviders';

import { BrandIntro } from '@/components/brand/BrandIntro';
import {
  decideIntroVariant,
  markIntroSeen,
  type IntroVariant,
} from '@/components/brand/introVariant';
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
  decideIntro = decideIntroVariant,
}: {
  children: ReactNode;
  load?: () => Promise<BootData>;
  decideIntro?: () => Promise<IntroVariant>;
}) {
  const [boot, setBoot] = useState<BootData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [intro, setIntro] = useState<IntroVariant | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const splashHidden = useRef(false);
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
  useEffect(() => {
    let active = true;
    void decideIntro()
      .catch((): IntroVariant => 'short')
      .then((variant) => {
        if (active) setIntro(variant);
      });
    return () => {
      active = false;
    };
  }, [decideIntro]);
  // The intro starts on the same white as the native splash, so it can take over at once.
  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    void Splash.hideAsync().catch(() => undefined);
  }, []);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const title = i18n.t('navigation.error', az.navigation.error);
  const retry = i18n.t('navigation.retry', az.navigation.retry);
  return (
    <View testID="boot-layout" style={styles.root}>
      {boot ? (
        <RuntimeProviders boot={boot} onBootConsumed={consumeBoot}>
          {children}
        </RuntimeProviders>
      ) : failed && introDone ? (
        <ErrorState
          title={title}
          retryLabel={retry}
          onRetry={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        />
      ) : introDone ? (
        // Retrying after a failure: the intro has already played.
        <View style={styles.loading}>
          <Skeleton
            width="100%"
            height={layout.controlHeight}
            accessibilityLabel={az.navigation.loading}
          />
        </View>
      ) : null}
      {intro && !introDone ? (
        <BrandIntro
          variant={intro}
          ready={boot !== null || failed}
          onFinished={finishIntro}
          onFullPlayed={markIntroSeen}
          onLayout={hideSplash}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loading: { padding: spacing.screenMargin },
});
