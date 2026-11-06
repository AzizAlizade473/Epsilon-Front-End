import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Utensils from 'lucide-react-native/icons/utensils';
import { Icon } from '@/components/ui/Icon';
import { colors, radius } from '@/design';
import { premium } from '@/design/premium';
import { env } from '@/lib/env';
import type { FoodPhoto } from '@/services/contracts/restaurant-catalog';

/** Bundled stock imagery is deliberately available only in development mock mode. */
export function FoodImage({
  photo,
  uri,
  width,
  height,
  rounded = true,
}: {
  photo?: FoodPhoto;
  uri?: string | null;
  width: number;
  height: number;
  rounded?: boolean;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{
    photo: FoodPhoto;
    source: number;
  } | null>(null);
  useEffect(() => {
    let current = true;
    if (
      __DEV__ &&
      env.EXPO_PUBLIC_APP_ENV !== 'production' &&
      env.EXPO_PUBLIC_API_MODE === 'mock' &&
      photo
    ) {
      void import('@/services/mock/food-assets').then((module) => {
        if (current) setLoaded({ photo, source: module.foodAssets[photo] });
      });
    }
    return () => {
      current = false;
    };
  }, [photo]);
  const source = loaded?.photo === photo ? loaded?.source : null;
  const remote = uri?.startsWith('https://') && uri !== failedUri ? uri : null;
  const style: StyleProp<ViewStyle> = {
    width,
    height,
    borderRadius: rounded ? radius[20] : 0,
    backgroundColor: premium.foodCanvas,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };
  return (
    <View style={style}>
      {source || remote ? (
        <Image
          source={source ?? { uri: remote! }}
          style={{ width, height }}
          contentFit={source ? 'cover' : 'contain'}
          onError={() => setFailedUri(remote)}
          transition={0}
          accessible={false}
        />
      ) : (
        <Icon
          icon={Utensils}
          color={colors.brand.accent}
          decorative
          size="large"
        />
      )}
    </View>
  );
}
