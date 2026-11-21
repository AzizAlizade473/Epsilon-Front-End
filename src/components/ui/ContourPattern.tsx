import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, layout } from '@/design';
import { cardContourPaths, contourPaths } from '@/design/contour';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/**
 * Static topographic lines from the business card. Fills its parent; drawn once
 * per size and memoized, so it costs nothing on re-render (no animation).
 */
export const ContourPattern = memo(function ContourPattern({
  color = colors.brand.onDeep,
  opacity = layout.contourOpacity,
  composition = 'field',
}: {
  color?: string;
  opacity?: number;
  /** 'card' = one non-crossing ring set; 'field' = the multi-origin header texture. */
  composition?: 'card' | 'field';
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.width || height !== size.height)
          setSize({ width: Math.round(width), height: Math.round(height) });
      }}
    >
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          strokeWidth={layout.borderWidth}
          {...decorativeSvgProps}
        >
          {(composition === 'card' ? cardContourPaths : contourPaths)(
            size.width,
            size.height,
          ).map((d, i) => (
            <Path
              key={i}
              d={d}
              fill="none"
              stroke={color}
              strokeOpacity={opacity}
            />
          ))}
        </Svg>
      )}
    </View>
  );
});
