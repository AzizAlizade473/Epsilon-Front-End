import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Store from 'lucide-react-native/icons/store';
import { Icon } from '@/components/ui/Icon';
import { originalReceipts as o } from '@/design/original-receipts';
import { matchBrand } from '@/lib/brands';

/**
 * One merchant identity everywhere: a recognised chain's authorised logo file,
 * else the server's logo, else a neutral shop mark. Never a made-up brand
 * badge: a chain without a logo file gets the neutral mark too.
 */
export function BrandBadge({
  name,
  logoUrl,
  size = o.size.icon,
  fallback = true,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  /** false: render nothing when there is no real logo (lists that already show a picture). */
  fallback?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const brand = matchBrand(name)?.brand;
  const box = { width: size, height: size, borderRadius: size * 0.28 };
  const inner = Math.round(size * 0.72);
  if (brand?.logo && !broken)
    return (
      // White tile, logo contained with breathing room: original colours and proportions, never cropped.
      // Exact pixel size (no percentages): Android lays percentage images out at 0×0 inside padded boxes.
      <View style={[styles.box, box, styles.logoTile]}>
        <Image
          source={brand.logo}
          style={{ width: inner, height: inner }}
          contentFit="contain"
          onError={() => setBroken(true)}
          accessible={false}
        />
      </View>
    );
  if (logoUrl && !broken)
    return (
      <View style={[styles.box, box, styles.logoTile]}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: inner, height: inner }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setBroken(true)}
          accessible={false}
        />
      </View>
    );
  if (!fallback) return null;
  return (
    <View style={[styles.box, box, styles.neutral]}>
      <Icon icon={Store} color={o.colors.primary} decorative />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoTile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: o.colors.border,
  },
  neutral: { backgroundColor: o.colors.primaryTint },
});
