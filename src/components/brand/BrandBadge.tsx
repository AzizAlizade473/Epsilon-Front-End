import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Utensils from 'lucide-react-native/icons/utensils';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { originalReceipts as o } from '@/design/original-receipts';
import { matchBrand } from '@/lib/brands';

/**
 * One merchant identity everywhere: a recognised chain's logo (or its name in
 * the brand colours until an authorised logo file exists), else the server's
 * logo, else the restaurant icon. A failing image falls back to the icon.
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
  if (brand)
    return (
      <View
        style={[styles.box, box, { backgroundColor: brand.color }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            styles.word,
            {
              color: brand.ink,
              fontSize: size * (brand.name.length > 4 ? 0.22 : 0.3),
            },
          ]}
        >
          {brand.name}
        </Text>
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
  return (
    <View style={[styles.box, box, { backgroundColor: o.colors.foodTint }]}>
      <Icon icon={Utensils} color={o.colors.food} decorative />
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
  word: { fontWeight: '800', letterSpacing: -0.2, textAlign: 'center' },
});
