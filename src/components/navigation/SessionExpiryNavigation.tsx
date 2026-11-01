import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { onSessionExpired } from '@/lib/runtime-notices';
export function SessionExpiryNavigation() {
  const router = useRouter();
  const navigation = useRootNavigationState();
  const [generation, setGeneration] = useState(0);
  const handled = useRef(0);
  useEffect(
    () => onSessionExpired(() => setGeneration((value) => value + 1)),
    [],
  );
  useEffect(() => {
    if (!generation || handled.current === generation || !navigation?.key)
      return;
    handled.current = generation;
    router.dismissAll();
    router.replace('/welcome');
  }, [generation, navigation?.key, router]);
  return null;
}
