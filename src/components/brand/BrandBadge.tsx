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
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const brand = matchBrand(name)?.brand;
  const box = { width: size, height: size, borderRadius: size * 0.28 };
  if (brand?.logo && !broken)
    return (
      <Image
        source={brand.logo}
        style={[styles.box, box]}
        resizeMode="contain"
        onError={() => setBroken(true)}
        accessibilityIgnoresInvertColors
      />
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
  neutral: {
    backgroundColor: o.colors.soft,
    borderWidth: 1,
    borderColor: o.colors.border,
  },
});
