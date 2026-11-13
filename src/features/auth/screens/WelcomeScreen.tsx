import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeOut,
  interpolate,
  ReduceMotion,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import { Brand } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  colors,
  layout,
  motionTokens,
  radius,
  spacing,
  useMotion,
} from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { enter, labelFade } from '../components/entrance';
import { WaveHeader } from '../components/WaveHeader';

const fadeOut = FadeOut.duration(motionTokens.authLabelFade).reduceMotion(
  ReduceMotion.System,
);

const slides = ['welcome', 'scan', 'earn'] as const;
const last = slides.length - 1;

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const motion = useMotion();
  const window = useWindowDimensions();
  const gate = useRef(false);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(
    Math.min(window.width, layout.contentMaxWidth),
  );
  const pager = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const progress = useSharedValue(0);
  const settled = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      gate.current = false;
      setBusy(false);
    }, []),
  );
  const onScroll = useAnimatedScrollHandler((event) => {
    offset.set(event.contentOffset.x);
    progress.set(width > 0 ? event.contentOffset.x / (width * last) : 0);
    const next = width > 0 ? Math.round(event.contentOffset.x / width) : 0;
    if (next !== settled.get()) {
      settled.set(next);
      scheduleOnRN(setPage, next);
    }
  });
  const goTo = (next: number) => {
    setPage(next);
    settled.set(next);
    pager.current?.scrollTo({
      x: next * width,
      animated: !motion.reduceMotion,
    });
  };
  const openLogin = () => {
    if (gate.current || !authOperation.acquire()) return;
    gate.current = true;
    setBusy(true);
    router.push('/login');
    authOperation.release();
  };
  const headerHeight = Math.min(
    layout.welcomeHeaderMax,
    Math.max(
      layout.welcomeHeaderMin,
      window.height * layout.welcomeHeaderRatio,
    ),
  );
  const onLast = page === last;
  return (
    <Screen
      surface="surface"
      scroll={false}
      edges={['bottom', 'left', 'right']}
      contentStyle={styles.bleed}
    >
      <WaveHeader height={headerHeight} progress={progress}>
        <Animated.View entering={enter(0)} style={styles.topRow}>
          <Brand inverse />
          {!onLast && (
            <Animated.View entering={labelFade} exiting={fadeOut}>
              <PressSurface
                accessibilityRole="button"
                accessibilityLabel={t('welcomePager.skip')}
                onPress={() => goTo(last)}
                contentStyle={styles.skip}
              >
                <Text variant="callout" style={styles.skipText}>
                  {t('welcomePager.skip')}
                </Text>
              </PressSurface>
            </Animated.View>
          )}
        </Animated.View>
      </WaveHeader>
      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={spacing[16]}
        onScroll={onScroll}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.pager}
        accessibilityLabel={t('welcomePager.position', {
          current: page + 1,
          total: slides.length,
        })}
      >
        {slides.map((slide, index) => (
          <View
            key={slide}
            style={[styles.slide, { width }]}
            accessibilityElementsHidden={index !== page}
            importantForAccessibility={
              index === page ? 'auto' : 'no-hide-descendants'
            }
          >
            <SlideCopy index={index} offset={offset} width={width}>
              <Animated.View entering={enter(1)}>
                <Text
                  variant="title1"
                  accessibilityRole="header"
                  style={styles.title}
                >
                  {t(`welcomePager.${slide}Title`)}
                </Text>
              </Animated.View>
              <Animated.View entering={enter(2)}>
                <Text tone="secondary">{t(`welcomePager.${slide}Body`)}</Text>
              </Animated.View>
            </SlideCopy>
          </View>
        ))}
      </Animated.ScrollView>
      <Animated.View entering={enter(3)} style={styles.footer}>
        <View style={styles.dots} accessibilityElementsHidden>
          {slides.map((slide, index) => (
            <Dot key={slide} index={index} offset={offset} width={width} />
          ))}
        </View>
        <PressSurface
          accessibilityRole="button"
          accessibilityLabel={t(
            onLast ? 'common.continue' : 'welcomePager.next',
          )}
          disabled={busy}
          onPress={() => (onLast ? openLogin() : goTo(page + 1))}
          contentStyle={styles.cta}
        >
          <Animated.View
            key={onLast ? 'continue' : 'next'}
            entering={labelFade}
          >
            <Text variant="headline" style={styles.ctaText}>
              {t(onLast ? 'common.continue' : 'welcomePager.next')}
            </Text>
          </Animated.View>
          <View style={styles.arrow}>
            <Icon icon={ArrowRight} color={colors.surface} decorative />
          </View>
        </PressSurface>
      </Animated.View>
      <Animated.View entering={enter(4)}>
        <PressSurface
          accessibilityRole="link"
          accessibilityLabel={t('premium.browse')}
          onPress={() => router.push('/restaurants')}
          contentStyle={styles.browse}
        >
          <Text variant="callout" tone="secondary">
            {t('premium.browse')}
          </Text>
        </PressSurface>
      </Animated.View>
    </Screen>
  );
}

/** Copy trails the page slightly and fades with distance, so pages feel layered. */
function SlideCopy({
  index,
  offset,
  width,
  children,
}: {
  index: number;
  offset: SharedValue<number>;
  width: number;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => {
    const distance = offset.get() / Math.max(width, 1) - index;
    return {
      opacity: interpolate(
        Math.abs(distance),
        [0, 0.7],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: reduced
            ? 0
            : distance * width * motionTokens.slideParallax,
        },
      ],
    };
  });
  return <Animated.View style={[styles.copy, style]}>{children}</Animated.View>;
}

function Dot({
  index,
  offset,
  width,
}: {
  index: number;
  offset: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.min(
      1,
      Math.abs(offset.get() / Math.max(width, 1) - index),
    );
    return {
      width: interpolate(
        distance,
        [0, 1],
        [layout.pagerDotActive, layout.pagerDot],
      ),
      opacity: interpolate(distance, [0, 1], [1, 0.25]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  bleed: { padding: 0, gap: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skip: { paddingHorizontal: spacing[12], minHeight: layout.tapTarget },
  skipText: { color: colors.brand.onDeep },
  pager: { flexGrow: 1, flexShrink: 1 },
  slide: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: spacing[16],
    gap: spacing[12],
  },
  copy: { gap: spacing[12] },
  title: { color: colors.brand.deep, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenMargin,
    paddingTop: spacing[16],
  },
  dots: { flexDirection: 'row', gap: spacing[8], alignItems: 'center' },
  dot: {
    height: layout.pagerDot,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    minHeight: layout.tapTarget,
    paddingLeft: spacing[12],
  },
  ctaText: { color: colors.ink },
  arrow: {
    width: layout.tapTarget + spacing[4],
    height: layout.tapTarget + spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browse: {
    alignSelf: 'center',
    minHeight: layout.tapTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
    marginVertical: spacing[8],
  },
});
