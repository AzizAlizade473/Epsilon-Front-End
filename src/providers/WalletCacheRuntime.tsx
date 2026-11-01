import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { afterFirstFrame } from '@/lib/after-first-frame';
import { registerAuthCleanup } from '@/lib/auth-lifecycle';
import {
  clearWalletCache,
  createWalletCache,
} from '@/services/query/wallet-cache';
export function WalletCacheRuntime() {
  const client = useQueryClient();
  const { user } = useAuth();
  const owner = user?.id;
  useEffect(() => {
    const cache = owner ? createWalletCache(client, AsyncStorage, owner) : null;
    const unregister = registerAuthCleanup(async () => {
      cache?.stop();
      await clearWalletCache(AsyncStorage);
    });
    const cancel = afterFirstFrame(() => {
      void cache?.start().catch(() => undefined);
    });
    return () => {
      cancel();
      unregister();
      cache?.stop();
    };
  }, [client, owner]);
  return null;
}
