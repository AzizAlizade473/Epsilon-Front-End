import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors, radius } from '@/design';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import type { RetailProduct } from '../retail';

/** Readable label ink on any accent colour. */
export function inkOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) /
    255;
  return lum > 0.6 ? '#1E1E3A' : '#FFFFFF';
}

/** Tint of `hex` toward white, for the soft card backdrop. */
function wash(hex: string, amount = 0.86) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r},${g},${b})`;
}

/**
 * Original flat packaging illustration drawn from the product's own shape and
 * colours: bundled, instant, offline, and never a mismatched stock photo.
 * Static and memoized, so lists don't redraw it while scrolling.
 */
export const ProductArt = memo(function ProductArt({
  product,
  size,
  rounded = true,
}: {
  product: RetailProduct;
  size: number;
  rounded?: boolean;
}) {
  const { shape, color, accent } = product.art;
  const ink = inkOn(accent);
  // Neutral label lines, never brand text: these drawings must not imitate
  // real packaging we have no rights to reproduce.
  const label = (x: number, y: number, w: number, h: number) => (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={2.5} fill={accent} />
      <Rect
        x={x + w * 0.18}
        y={y + h * 0.3}
        width={w * 0.64}
        height={1.6}
        rx={0.8}
        fill={ink}
        opacity={0.85}
      />
      <Rect
        x={x + w * 0.28}
        y={y + h * 0.6}
        width={w * 0.44}
        height={1.4}
        rx={0.7}
        fill={ink}
        opacity={0.55}
      />
    </G>
  );
  const body = (() => {
    switch (shape) {
      case 'cup':
        return (
          <G>
            <Path d="M30 34 L70 34 L65 78 Q50 82 35 78 Z" fill={color} />
            <Ellipse cx={50} cy={34} rx={21} ry={5} fill={accent} />
            {label(33, 50, 34, 13)}
          </G>
        );
      case 'carton':
        return (
          <G>
            <Path d="M34 30 L50 20 L66 30 Z" fill={accent} />
            <Rect x={34} y={30} width={32} height={50} fill={color} />
            <Rect x={47} y={16} width={6} height={6} rx={1} fill={accent} />
            {label(36, 48, 28, 13)}
          </G>
        );
      case 'bottle':
        return (
          <G>
            <Rect x={44} y={14} width={12} height={7} rx={2} fill={accent} />
            <Path
              d="M45 21 L55 21 L55 30 Q64 34 64 44 L64 78 Q64 82 60 82 L40 82 Q36 82 36 78 L36 44 Q36 34 45 30 Z"
              fill={color}
            />
            {label(38, 52, 24, 14)}
          </G>
        );
      case 'loaf':
        return (
          <G>
            <Path
              d="M22 72 L22 50 Q22 30 50 30 Q78 30 78 50 L78 72 Q78 76 74 76 L26 76 Q22 76 22 72 Z"
              fill={color}
            />
            <Path
              d="M34 40 L40 46 M48 37 L54 43 M62 40 L68 46"
              stroke={accent}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            {label(34, 56, 32, 12)}
          </G>
        );
      case 'bag':
        return (
          <G>
            <Path
              d="M30 22 L70 22 L67 28 Q72 50 67 72 L70 78 L30 78 L33 72 Q28 50 33 28 Z"
              fill={color}
            />
            <Path
              d="M30 22 L70 22 M30 78 L70 78"
              stroke={accent}
              strokeWidth={3}
            />
            {label(35, 44, 30, 13)}
          </G>
        );
      case 'bar':
        return (
          <G>
            <Rect x={16} y={36} width={68} height={30} rx={3} fill={color} />
            <Path d="M70 36 L84 36 L84 50 Z" fill={accent} opacity={0.7} />
            {label(28, 44, 40, 14)}
          </G>
        );
      case 'jar':
        return (
          <G>
            <Rect x={34} y={22} width={32} height={9} rx={2} fill={accent} />
            <Rect x={31} y={30} width={38} height={50} rx={8} fill={color} />
            {label(35, 48, 30, 14)}
          </G>
        );
      case 'box':
        return (
          <G>
            <Path
              d="M28 34 L40 24 L76 24 L64 34 Z"
              fill={accent}
              opacity={0.85}
            />
            <Path
              d="M64 34 L76 24 L76 70 L64 80 Z"
              fill={accent}
              opacity={0.6}
            />
            <Rect x={28} y={34} width={36} height={46} fill={color} />
            {label(30, 50, 32, 13)}
          </G>
        );
      case 'tray':
        return (
          <G>
            {[30, 42, 54, 66, 36, 48, 60].map((cx, i) => (
              <Circle
                key={i}
                cx={cx + 2}
                cy={i < 4 ? 50 : 42}
                r={7}
                fill={color}
              />
            ))}
            <Path
              d="M18 52 L82 52 L76 74 L24 74 Z"
              fill={accent}
              opacity={0.9}
            />
            {label(32, 58, 36, 12)}
          </G>
        );
    }
  })();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? radius[20] : 0,
        overflow: 'hidden',
        backgroundColor: wash(accent),
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        {...decorativeSvgProps}
      >
        <Ellipse
          cx={50}
          cy={84}
          rx={26}
          ry={3.5}
          fill={colors.ink}
          opacity={0.08}
        />
        {body}
      </Svg>
    </View>
  );
});
