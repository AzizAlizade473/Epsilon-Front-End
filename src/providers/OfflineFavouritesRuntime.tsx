import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import {
  catalogLanguage,
  catalogOptions,
} from '@/features/restaurants/catalog';
import { restaurantDetailOptions } from '@/features/restaurants/hooks/useRestaurants';
import { likedListOptions } from '@/hooks/useLikes';
import { afterFirstFrame } from '@/lib/after-first-frame';
import { registerAuthCleanup } from '@/lib/auth-lifecycle';
import { i18n } from '@/lib/i18n';
import { services } from '@/services';
import { queryKeys } from '@/services/query';
import {
  clearOfflineFavourites,
  createOfflineFavourites,
  type OfflineFavourites,
} from '@/services/query/offline-favourites';

/** Keeps the favourites copy current: replays queued likes, then saves liked places. */
export function OfflineFavouritesRuntime() {
  const client = useQueryClient();
  const { user } = useAuth();
  const owner = user?.id;
  useEffect(() => {
    let copy: OfflineFavourites | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    /** Best effort: a failed request leaves the earlier saved copy in place. */
    const saveContent = () => {
      if (stopped || !onlineManager.isOnline()) return;
      const language = catalogLanguage(i18n.language);
      for (const id of copy?.favouriteIds() ?? []) {
        void client.prefetchQuery(restaurantDetailOptions(id));
        void client.prefetchQuery(catalogOptions(id, language));
      }
    };
    const sync = async () => {
      if (!copy || !onlineManager.isOnline()) return;
      const replayed = await copy.flush((kind, targetId, liked, snapshot) =>
        liked
          ? services.like.like(kind, targetId, snapshot)
          : services.like.unlike(kind, targetId),
      );
      if (stopped) return;
      if (replayed) await client.invalidateQueries({ queryKey: ['likes'] });
      if (stopped || copy.pending().length) return;
      await client.prefetchInfiniteQuery(
        likedListOptions(client, 'restaurant'),
      );
      saveContent();
    };
    const unregister = registerAuthCleanup(async () => {
      stopped = true;
      copy?.stop();
      await clearOfflineFavourites(AsyncStorage);
    });
    const cancel = afterFirstFrame(() => {
      if (!owner || stopped) return;
      copy = createOfflineFavourites(client, AsyncStorage, owner, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(saveContent, 250);
      });
      void copy
        .start()
        .then(sync)
        .catch(() => undefined);
    });
    const reconnect = onlineManager.subscribe((online) => {
      if (!online) return;
      void sync()
        .then(() =>
          client.invalidateQueries({ queryKey: queryKeys.restaurant.all }),
        )
        .catch(() => undefined);
    });
    return () => {
      stopped = true;
      cancel();
      reconnect();
      unregister();
      if (timer) clearTimeout(timer);
      copy?.stop();
    };
  }, [client, owner]);
  return null;
}
