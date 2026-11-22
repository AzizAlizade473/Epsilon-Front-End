import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { PixelRatio, View, type StyleProp, type ViewStyle } from 'react-native';
import Utensils from 'lucide-react-native/icons/utensils';
import { Icon } from '@/components/ui/Icon';
import { colors, radius } from '@/design';
import { premium } from '@/design/premium';
import { demoContent } from '@/lib/demoContent';
import type { FoodPhoto } from '@/services/contracts/restaurant-catalog';

/**
 * Request a CDN rendition close to the displayed size instead of the original.
 * Rounded up to 100 px steps so nearby sizes share one cached file.
 */
export function sizedUri(uri: string, width: number, ratio = PixelRatio.get()) {
  if (!uri.startsWith('https://images.unsplash.com/')) return uri;
  const target = Math.min(1600, Math.ceil((width * ratio) / 100) * 100);
  const url = new URL(uri);
  url.searchParams.set('w', String(target));
  return url.toString();
}

/** Bundled stock imagery is deliberately available only in development mock mode. */
export function FoodImage({
  photo,
  uri,
  width,
  height,
  rounded = true,
  cover = false,
}: {
  photo?: FoodPhoto;
  uri?: string | null;
  width: number;
  height: number;
  rounded?: boolean;
  /** Remote food photography fills the frame; remote logos stay contained. */
  cover?: boolean;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{
    photo: FoodPhoto;
    source: number;
  } | null>(null);
  useEffect(() => {
    let current = true;
    if (demoContent() && photo) {
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
          source={source ?? { uri: sizedUri(remote!, width) }}
          style={{ width, height }}
          contentFit={source || cover ? 'cover' : 'contain'}
          onError={() => setFailedUri(remote)}
          cachePolicy="memory-disk"
          recyclingKey={remote ?? undefined}
          // Short fade for network loads only; cached/bundled images appear at once.
          transition={source ? 0 : 150}
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
