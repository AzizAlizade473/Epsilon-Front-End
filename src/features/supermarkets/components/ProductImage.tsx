import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { View } from 'react-native';
import { colors, radius, spacing } from '@/design';
import type { RetailProduct } from '../retail';
import { ProductArt } from './ProductArt';

/**
 * The product's listed packshot on a clean white tile, never stretched. If the
 * image is missing or fails to load it falls back to the neutral drawing.
 */
export const ProductImage = memo(function ProductImage({
  product,
  size,
  rounded = true,
}: {
  product: RetailProduct;
  size: number;
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!product.imageUrl || failed)
    return <ProductArt product={product} size={size} rounded={rounded} />;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? radius[20] : 0,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: rounded ? 1 : 0,
        borderColor: colors.divider,
        padding: spacing[4],
      }}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={{ width: size - spacing[4] * 2, height: size - spacing[4] * 2 }}
        contentFit="contain"
        cachePolicy="memory-disk"
        recyclingKey={product.id}
        onError={() => setFailed(true)}
        accessible={false}
      />
    </View>
  );
});
