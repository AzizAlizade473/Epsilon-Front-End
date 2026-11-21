import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import { BrandMark } from '@/components/ui/Brand';
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
import { Rise } from '../components/Rise';
import { WaveHeader } from '../components/WaveHeader';

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
        <Rise order={0} style={styles.topRow}>
          <BrandMark inverse />
          {!onLast && (
            <Rise rise={false} duration={motionTokens.authLabelFade}>
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
            </Rise>
          )}
        </Rise>
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
              <Rise order={1}>
                <Text
                  variant="title1"
                  accessibilityRole="header"
                  style={styles.title}
                >
                  {t(`welcomePager.${slide}Title`)}
                </Text>
              </Rise>
              <Rise order={2}>
                <Text tone="secondary">{t(`welcomePager.${slide}Body`)}</Text>
              </Rise>
            </SlideCopy>
          </View>
        ))}
      </Animated.ScrollView>
      <Rise order={3} style={styles.footer}>
        <View
          style={[styles.dots, { width: dotsWidth }]}
          accessibilityElementsHidden
        >
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
          <Rise
            key={onLast ? 'continue' : 'next'}
            rise={false}
            duration={motionTokens.authLabelFade}
          >
            <Text variant="headline" style={styles.ctaText}>
              {t(onLast ? 'common.continue' : 'welcomePager.next')}
            </Text>
          </Rise>
          <ArrowCircle progress={progress} />
        </PressSurface>
      </Rise>
      <Rise order={4}>
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
      </Rise>
    </Screen>
  );
}

/** Copy runs slightly ahead of the page and fades early, so pages never overlap. */
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
        [0, 0.5],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: reduced
            ? 0
            : -distance * width * motionTokens.slideParallax,
        },
      ],
    };
  });
  return <Animated.View style={[styles.copy, style]}>{children}</Animated.View>;
}

const dotsWidth = layout.pagerDotActive + last * (layout.pagerDot + spacing[8]);

/** Absolute, childless pills: width/left change without relaying out siblings. */
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
    const page = offset.get() / Math.max(width, 1);
    const size = (i: number) =>
      interpolate(
        Math.min(1, Math.abs(page - i)),
        [0, 1],
        [layout.pagerDotActive, layout.pagerDot],
      );
    let left = 0;
    for (let i = 0; i < index; i += 1) left += size(i) + spacing[8];
    const own = size(index);
    return {
      left,
      width: own,
      opacity: interpolate(
        own,
        [layout.pagerDot, layout.pagerDotActive],
        [0.25, 1],
      ),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const arrowSize = layout.tapTarget + spacing[4];
const shaft = spacing[20];
const mid = arrowSize / 2;

/** Reference-style arrow: the shaft pierces the circle, which tints with the page. */
function ArrowCircle({ progress }: { progress: SharedValue<number> }) {
  const tint = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 0.5, 1],
      [colors.brand.deep, colors.brand.secondary, colors.brand.accent],
    ),
  }));
  return (
    <View style={styles.arrowBox}>
      <Animated.View style={[styles.arrowCircle, tint]} />
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${arrowSize + shaft} ${arrowSize}`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        {...decorativeSvgProps}
      >
        <Path d={`M2 ${mid} H${shaft}`} stroke={colors.brand.deep} />
        <Path
          d={`M${shaft} ${mid} H${shaft + mid + 8} M${shaft + mid + 1} ${mid - 7} L${shaft + mid + 8} ${mid} L${shaft + mid + 1} ${mid + 7}`}
          stroke={colors.surface}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: { padding: 0, gap: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skip: { paddingHorizontal: spacing[12], minHeight: layout.tapTarget },
  skipText: { color: colors.surface },
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
  dots: { height: layout.pagerDot },
  dot: {
    position: 'absolute',
    top: 0,
    height: layout.pagerDot,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    minHeight: layout.tapTarget,
    paddingLeft: spacing[12],
  },
  ctaText: { color: colors.ink },
  arrowBox: { width: arrowSize + shaft, height: arrowSize },
  arrowCircle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: arrowSize,
    height: arrowSize,
    borderRadius: radius.pill,
  },
  browse: {
    alignSelf: 'center',
    minHeight: layout.tapTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
    marginVertical: spacing[8],
  },
});
