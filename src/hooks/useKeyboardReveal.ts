import { useEffect, useRef, type RefObject } from 'react';
import {
  Keyboard,
  Platform,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { spacing } from '@/design';

/** How far to scroll so a field ending at `inputBottom` sits above the keyboard. */
export function revealDelta(
  inputBottom: number,
  keyboardTop: number,
  margin: number = spacing[24],
) {
  return Math.max(0, inputBottom + margin - keyboardTop);
}

/**
 * Android edge-to-edge no longer resizes the window for the keyboard, so a
 * focused field can sit under it. After the keyboard opens (and the
 * KeyboardAvoidingView has padded the layout), scroll the focused input into view.
 */
export function useKeyboardReveal(
  scrollRef: RefObject<ScrollViewInstance | null>,
  enabled: boolean,
) {
  const offset = useRef(0);
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = Keyboard.addListener('keyboardDidShow', (event) => {
      clearTimeout(timer);
      // Wait one layout pass for the avoiding view's new padding.
      timer = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput();
        input?.measureInWindow((_x, y, _w, height) => {
          const delta = revealDelta(y + height, event.endCoordinates.screenY);
          if (delta > 0)
            scrollRef.current?.scrollTo({
              y: offset.current + delta,
              animated: true,
            });
        });
      }, 100);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [enabled, scrollRef]);
  return (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  };
}
