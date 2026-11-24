import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
  if (brand?.logo && !broken)
    return (
      // White tile, logo contained with breathing room: original colours and proportions, never cropped.
      <View style={[styles.box, box, styles.logoTile]}>
        <Image
          source={brand.logo}
          style={styles.logo}
          resizeMode="contain"
          onError={() => setBroken(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  if (logoUrl && !broken)
    return (
      <Image
        source={{ uri: logoUrl }}
        style={[styles.box, box]}
        onError={() => setBroken(true)}
        accessibilityIgnoresInvertColors
      />
    );
  if (!fallback) return null;
  return (
    <View style={[styles.box, box, styles.neutral]}>
      <Icon icon={Store} color={o.colors.secondary} decorative />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  logoTile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: o.colors.border,
    padding: '14%',
  },
  logo: { width: '100%', height: '100%' },
  neutral: {
    backgroundColor: o.colors.soft,
    borderWidth: 1,
    borderColor: o.colors.border,
  },
});
