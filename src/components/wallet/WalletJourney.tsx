import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type ComponentRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { Amount } from '@/components/ui/Amount';
import { useWallet } from '@/hooks/useWallet';
import { useMotion } from '@/design';
import { walletDesign as w } from '@/design/wallet';
import { WalletSurface } from './WalletSurface';

type Rect = { x: number; y: number; width: number; height: number };
export type WalletCardRef = ComponentRef<typeof View>;
type Flight = { from: Rect; to?: Rect; closing: boolean };
type Journey = {
  active: boolean;
  open: (view: WalletCardRef | null) => void;
  close: () => void;
  arrive: (view: WalletCardRef | null) => void;
  registerHome: (view: WalletCardRef | null) => void;
};
const Context = createContext<Journey | null>(null);

/** The same measured card flies above both tabs; no experimental shared-element API. */
export function WalletJourney({ children }: { children: ReactNode }) {
  const router = useRouter();
  const motion = useMotion();
  const host = useRef<WalletCardRef>(null);
  const homeCard = useRef<WalletCardRef | null>(null);
  const source = useRef<Rect | null>(null);
  const target = useRef<Rect | null>(null);
  const lock = useRef(false);
  const measuring = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const progress = useSharedValue(0);
  const finish = useCallback(() => {
    setFlight(null);
    lock.current = false;
  }, []);
  useEffect(
    () => () => {
      if (measuring.current) clearTimeout(measuring.current);
    },
    [],
  );
  const measure = useCallback(
    (view: WalletCardRef | null, done: (rect: Rect) => void) => {
      if (!view || !host.current) return;
      host.current.measureInWindow((hx, hy) => {
        view.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0)
            done({ x: x - hx, y: y - hy, width, height });
        });
      });
    },
    [],
  );
  const open = useCallback(
    (view: WalletCardRef | null) => {
      if (lock.current) return;
      const origin = view ?? homeCard.current;
      if (motion.reduceMotion || !origin) {
        router.navigate('/cashback');
        return;
      }
      lock.current = true;
      measuring.current = setTimeout(() => {
        lock.current = false;
        router.navigate('/cashback');
      }, w.transitionTimeout);
      measure(origin, (rect) => {
        if (measuring.current) clearTimeout(measuring.current);
        source.current = rect;
        progress.set(0);
        setFlight({ from: rect, closing: false });
        router.navigate('/cashback');
      });
    },
    [measure, motion.reduceMotion, progress, router],
  );
  const arrive = useCallback(
    (view: WalletCardRef | null) => {
      measure(view, (rect) => {
        target.current = rect;
        setFlight((current) =>
          current && !current.closing ? { ...current, to: rect } : current,
        );
      });
    },
    [measure],
  );
  const registerHome = useCallback((view: WalletCardRef | null) => {
    homeCard.current = view;
  }, []);
  const close = useCallback(() => {
    if (lock.current) return;
    if (!motion.reduceMotion && source.current && target.current) {
      lock.current = true;
      progress.set(0);
      setFlight({ from: target.current, to: source.current, closing: true });
    }
    router.navigate('/home');
  }, [motion.reduceMotion, progress, router]);
  useEffect(() => {
    if (!flight) return;
    if (motion.reduceMotion) {
      const frame = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(frame);
    }
    const safety = setTimeout(finish, w.transitionTimeout);
    if (flight.to) {
      progress.set(
        withSpring(1, w.spring, (done) => {
          if (done) runOnJS(finish)();
        }),
      );
    }
    return () => {
      clearTimeout(safety);
      cancelAnimation(progress);
    };
  }, [flight, finish, motion.reduceMotion, progress]);
  const cardStyle = useAnimatedStyle(() => {
    if (!flight) return {};
    const destination = flight.to ?? flight.from;
    return {
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 1],
            [flight.from.x, destination.x],
          ),
        },
        {
          translateY: interpolate(
            progress.value,
            [0, 1],
            [flight.from.y, destination.y],
          ),
        },
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [1, destination.width / flight.from.width],
          ),
        },
      ],
    };
  });
  return (
    <Context.Provider
      value={{ active: Boolean(flight), open, close, arrive, registerHome }}
    >
      <View ref={host} collapsable={false} style={styles.fill}>
        {children}
        {flight && (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
          >
            <Animated.View
              style={[styles.flying, { width: flight.from.width }, cardStyle]}
            >
              <TravelingWallet />
            </Animated.View>
          </View>
        )}
      </View>
    </Context.Provider>
  );
}

function TravelingWallet() {
  const wallet = useWallet();
  if (!wallet.data) return null;
  return (
    <WalletSurface pendingMinor={wallet.data.pendingMinor}>
      <Amount minor={wallet.data.balanceMinor} tone="inverse" />
    </WalletSurface>
  );
}

export function useWalletJourney() {
  return useContext(Context);
}

/** Measure after focus/layout, including the already-mounted tab on later visits. */
export function useWalletArrival(ref: RefObject<WalletCardRef | null>) {
  const journey = useWalletJourney();
  const arrive = journey?.arrive;
  useFocusEffect(
    useCallback(() => {
      const frame = requestAnimationFrame(() => arrive?.(ref.current));
      return () => cancelAnimationFrame(frame);
    }, [arrive, ref]),
  );
  return () => arrive?.(ref.current);
}

export function WalletEntrance({
  children,
  order = 0,
}: {
  children: ReactNode;
  order?: number;
}) {
  const motion = useMotion();
  const progress = useSharedValue(1);
  useFocusEffect(
    useCallback(() => {
      if (motion.reduceMotion) {
        progress.set(1);
        return;
      }
      progress.set(0);
      const timer = setTimeout(() => {
        progress.set(withSpring(1, w.spring));
      }, order * w.stagger);
      return () => {
        clearTimeout(timer);
        cancelAnimation(progress);
        progress.set(1);
      };
    }, [motion.reduceMotion, order, progress]),
  );
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: w.rise * (1 - progress.value) }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  flying: {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: 'top left',
  },
});
