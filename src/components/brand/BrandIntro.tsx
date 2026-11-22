import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import az from '../../../locales/az.json';

import {
  INTRO_DRAW_MS,
  INTRO_LETTERS,
  INTRO_MARK,
  INTRO_MARK_RATIO,
  INTRO_VIDEO,
  INTRO_WORDMARK_RATIO,
  type IntroLetter,
} from './brandIntroAssets';
import { introVideoAvailable, type IntroVariant } from './introVariant';

import { colors, motionTokens } from '@/design';
import { i18n } from '@/lib/i18n';

const T = motionTokens.intro;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
const lettersTotal = (duration: number, stagger: number) =>
  duration + stagger * (INTRO_LETTERS.length - 1);
const LETTERS_TOTAL = lettersTotal(T.letterDuration, T.letterStagger);
// Later launches: already composed (no rise) and quicker, so the app is reached sooner.
const SHORT_PACE = {
  duration: T.shortLetterDuration,
  stagger: T.shortLetterStagger,
} as const;
const FULL_PACE = {
  duration: T.letterDuration,
  stagger: T.letterStagger,
} as const;
const HAIRLINE_HEIGHT = 2;

type VideoModule = typeof import('expo-video');
// Loaded only when the native module exists, so builds without it never crash on import.
const video: VideoModule | null = introVideoAvailable()
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- a static import would crash builds without the native module
    (require('expo-video') as VideoModule)
  : null;

type Props = {
  variant: IntroVariant;
  /** Boot finished (successfully or not): the intro may leave once its choreography ends. */
  ready: boolean;
  onFinished: () => void;
  /** The full drawn intro played to the end (remember it for this app version). */
  onFullPlayed?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/**
 * Launch intro on white: the logo is drawn in one stroke (full), the finished mark
 * rises to make room while the wordmark lifts in letter by letter, a hairline breathes
 * only if the app is still loading, then everything clears into the app.
 */
export function BrandIntro({
  variant,
  ready,
  onFinished,
  onFullPlayed,
  onLayout,
}: Props) {
  const { width } = useWindowDimensions();
  const markW = Math.min(width * 0.42, 200);
  const markH = markW / INTRO_MARK_RATIO;
  const wordW = markW * 0.92;
  const wordH = wordW / INTRO_WORDMARK_RATIO;
  const gap = markW * 0.14;
  const lift = (gap + wordH) / 2;
  const still = variant === 'still';
  const composed = variant !== 'full';

  const groupY = useSharedValue(composed ? 0 : lift);
  const groupScale = useSharedValue(1);
  const content = useSharedValue(still ? 0 : 1);
  const background = useSharedValue(1);
  const markOpacity = useSharedValue(variant === 'full' ? 0 : still ? 1 : 0);
  const markScale = useSharedValue(variant === 'short' ? T.shortMarkScale : 1);
  const videoOpacity = useSharedValue(0);
  const hairline = useSharedValue(0);
  const hairlineX = useSharedValue(0);

  const [lettersGo, setLettersGo] = useState(still);
  const pace = composed ? SHORT_PACE : FULL_PACE;
  const [choreoDone, setChoreoDone] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const settled = useRef(false);
  const exitStarted = useRef(false);
  // Leaves once its own choreography has ended and the app is ready behind it.
  const exiting = choreoDone && ready;
  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const settle = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    groupY.set(
      withDelay(
        T.settleDelay,
        withTiming(0, { duration: T.rise, easing: EASE_IN_OUT }),
      ),
    );
    schedule(() => setLettersGo(true), T.settleDelay + 80);
    schedule(
      () => setChoreoDone(true),
      T.settleDelay + Math.max(T.rise, 80 + LETTERS_TOTAL),
    );
  }, [groupY, schedule]);

  const startShort = useCallback(() => {
    videoOpacity.set(0);
    markOpacity.set(
      withTiming(1, { duration: T.shortMarkIn, easing: EASE_OUT }),
    );
    markScale.set(withTiming(1, { duration: T.shortMarkIn, easing: EASE_OUT }));
    if (!composed) {
      settle(); // a full intro whose video failed still rises to make room
      return;
    }
    settled.current = true;
    schedule(() => setLettersGo(true), T.shortLetterDelay);
    schedule(
      () => setChoreoDone(true),
      T.shortLetterDelay +
        Math.max(
          T.shortMarkIn,
          lettersTotal(SHORT_PACE.duration, SHORT_PACE.stagger),
        ),
    );
  }, [composed, markOpacity, markScale, schedule, settle, videoOpacity]);

  const drawn = useRef(false);
  const onFirstFrame = useCallback(() => {
    videoOpacity.set(1);
  }, [videoOpacity]);
  const onDrawEnd = useCallback(() => {
    if (drawn.current || settled.current) return;
    drawn.current = true;
    // The video's last frame is the finished mark in the same box: swap in the same frame.
    markOpacity.set(1);
    videoOpacity.set(0);
    settle();
    onFullPlayed?.();
  }, [markOpacity, onFullPlayed, settle, videoOpacity]);
  const onVideoFail = useCallback(() => {
    if (!drawn.current) startShort();
  }, [startShort]);

  useEffect(() => {
    if (still) {
      content.set(withTiming(1, { duration: T.reducedFade }));
      schedule(() => setChoreoDone(true), T.reducedFade);
    } else if (variant === 'short' || !video) {
      startShort();
    } else {
      schedule(() => {
        if (videoOpacity.get() === 0 && !drawn.current) onVideoFail();
      }, T.firstFrameTimeout);
      schedule(onDrawEnd, INTRO_DRAW_MS + T.endGrace);
    }
    // Runs once per mount: the variant never changes while the intro is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!choreoDone || ready) return;
    const id = setTimeout(() => setWaiting(true), T.waitDelay);
    return () => clearTimeout(id);
  }, [choreoDone, ready]);

  useEffect(() => {
    if (!waiting || exiting) return;
    hairline.set(withTiming(1, { duration: T.hairlineFade, easing: EASE_OUT }));
    if (still) {
      hairlineX.set(0.5); // a calm, centred segment instead of a moving one
    } else {
      hairlineX.set(
        withRepeat(
          withTiming(1, { duration: T.hairlineLoop, easing: Easing.linear }),
          -1,
          false,
        ),
      );
    }
  }, [exiting, hairline, hairlineX, still, waiting]);

  useEffect(() => {
    if (!exiting || exitStarted.current) return;
    exitStarted.current = true;
    if (still) {
      content.set(withTiming(0, { duration: T.reducedFade }));
      background.set(withTiming(0, { duration: T.reducedFade }));
      schedule(onFinished, T.reducedFade);
      return;
    }
    content.set(withTiming(0, { duration: T.exit * 0.8, easing: EASE_OUT }));
    groupScale.set(
      withTiming(T.exitScale, { duration: T.exit, easing: EASE_OUT }),
    );
    background.set(
      withDelay(
        T.exitBackgroundDelay,
        withTiming(0, { duration: T.exit, easing: EASE_OUT }),
      ),
    );
    schedule(onFinished, T.exit + T.exitBackgroundDelay);
  }, [background, content, exiting, groupScale, onFinished, schedule, still]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: background.get(),
  }));
  const groupStyle = useAnimatedStyle(() => ({
    opacity: content.get(),
    transform: [{ translateY: groupY.get() }, { scale: groupScale.get() }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.get(),
    transform: [{ scale: markScale.get() }],
  }));
  const videoStyle = useAnimatedStyle(() => ({
    opacity: videoOpacity.get(),
  }));
  const trackW = wordW * 0.28;
  const segW = trackW * 0.35;
  const hairlineStyle = useAnimatedStyle(() => ({
    opacity: hairline.get(),
  }));
  const segmentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -segW + hairlineX.get() * (trackW + segW) }],
  }));

  const label = `Epsilon. ${i18n.t('navigation.loading', az.navigation.loading)}`;

  return (
    <View
      testID="brand-intro"
      style={StyleSheet.absoluteFill}
      pointerEvents={exiting ? 'none' : 'auto'}
      onLayout={onLayout}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: !ready }}
    >
      <Animated.View style={[styles.background, backgroundStyle]} />
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={[styles.group, groupStyle]}>
          <View style={{ width: markW, height: markH }}>
            {variant === 'full' && video ? (
              <Animated.View style={[StyleSheet.absoluteFill, videoStyle]}>
                <IntroVideo
                  module={video}
                  style={StyleSheet.absoluteFill}
                  onFirstFrame={onFirstFrame}
                  onEnd={onDrawEnd}
                  onFail={onVideoFail}
                />
              </Animated.View>
            ) : null}
            <Animated.View style={[StyleSheet.absoluteFill, markStyle]}>
              <Image
                source={INTRO_MARK}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                accessible={false}
              />
            </Animated.View>
          </View>
          <View style={{ width: wordW, marginTop: gap }}>
            <View style={{ width: wordW, height: wordH, overflow: 'hidden' }}>
              {INTRO_LETTERS.map((letter, index) => (
                <Letter
                  key={index}
                  letter={letter}
                  index={index}
                  boxW={wordW}
                  boxH={wordH}
                  go={lettersGo}
                  pace={pace}
                  still={still}
                />
              ))}
            </View>
            {/* Out of flow, so it never shifts the centred composition. */}
            <Animated.View
              style={[
                styles.track,
                {
                  top: wordH + gap,
                  left: (wordW - trackW) / 2,
                  width: trackW,
                  height: HAIRLINE_HEIGHT,
                  borderRadius: HAIRLINE_HEIGHT / 2,
                },
                hairlineStyle,
              ]}
            >
              <Animated.View
                style={[
                  styles.segment,
                  { width: segW, height: HAIRLINE_HEIGHT },
                  segmentStyle,
                ]}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function Letter({
  letter,
  index,
  boxW,
  boxH,
  go,
  pace,
  still,
}: {
  letter: IntroLetter;
  index: number;
  boxW: number;
  boxH: number;
  go: boolean;
  pace: { duration: number; stagger: number };
  still: boolean;
}) {
  const progress = useSharedValue(still ? 1 : 0);
  const h = letter.height * boxH;
  useEffect(() => {
    if (!go || still) return;
    progress.set(
      withDelay(
        index * pace.stagger,
        withTiming(1, { duration: pace.duration, easing: EASE_OUT }),
      ),
    );
  }, [go, index, pace, progress, still]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * T.letterRise * h }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: letter.left * boxW,
          top: letter.top * boxH,
          width: letter.width * boxW,
          height: h,
        },
        style,
      ]}
    >
      <Image
        source={letter.source}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        accessible={false}
      />
    </Animated.View>
  );
}

function IntroVideo({
  module,
  style,
  onFirstFrame,
  onEnd,
  onFail,
}: {
  module: VideoModule;
  style: StyleProp<ViewStyle>;
  onFirstFrame: () => void;
  onEnd: () => void;
  onFail: () => void;
}) {
  const player = module.useVideoPlayer(INTRO_VIDEO, (p) => {
    p.muted = true;
    p.loop = false;
    p.audioMixingMode = 'mixWithOthers'; // never pause the user's music
    p.play();
  });
  useEffect(() => {
    const end = player.addListener('playToEnd', onEnd);
    const status = player.addListener('statusChange', ({ status: s }) => {
      if (s === 'error') onFail();
    });
    return () => {
      end.remove();
      status.remove();
    };
  }, [onEnd, onFail, player]);
  return (
    <module.VideoView
      player={player}
      style={style}
      nativeControls={false}
      contentFit="contain"
      surfaceType="textureView"
      onFirstFrameRender={onFirstFrame}
      pointerEvents="none"
      accessible={false}
    />
  );
}

const fill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

const styles = StyleSheet.create({
  background: { ...fill, backgroundColor: colors.surface },
  center: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { alignItems: 'center' },
  track: {
    position: 'absolute',
    backgroundColor: colors.brand.tint,
    overflow: 'hidden',
  },
  segment: { backgroundColor: colors.brand.logo },
});
