import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design';
import { premium } from '@/design/premium';
import type { CatalogDish } from '../catalog';

const pad = spacing[8];
function monthLabel(month: string, locale: string) {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(
    new Date(Date.UTC(y!, m! - 1, 15)),
  );
}

/** Monthly average line. Static SVG, memoized so parent updates skip it. */
export const RatingTrend = memo(function RatingTrend({
  trend,
}: {
  trend: CatalogDish['trend'];
}) {
  const { t, i18n } = useTranslation();
  const [width, setWidth] = useState(0);
  if (trend.length < 2) return null;
  const values = trend.map((p) => p.average);
  const low = Math.max(1, Math.min(...values) - 0.2);
  const high = Math.min(5, Math.max(...values) + 0.2);
  const h = premium.trendHeight;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (trend.length - 1);
  const y = (v: number) =>
    pad + (1 - (v - low) / Math.max(0.1, high - low)) * (h - pad * 2);
  const line = trend
    .map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.average)}`)
    .join(' ');
  const area = `${line} L${x(trend.length - 1)},${h} L${x(0)},${h} Z`;
  const first = trend[0]!;
  const last = trend[trend.length - 1]!;
  const delta = last.average - first.average;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={t('dining.trendLabel', {
        from: `${monthLabel(first.month, i18n.language)} ${first.average.toFixed(1)}`,
        to: `${monthLabel(last.month, i18n.language)} ${last.average.toFixed(1)}`,
      })}
    >
      <View style={styles.head}>
        <Text variant="headline">{t('dining.trend')}</Text>
        <Text
          variant="callout"
          style={{
            color: delta >= 0 ? colors.successInk : colors.danger,
          }}
        >
          {`${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}`}
        </Text>
      </View>
      <View
        style={styles.chart}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <Svg width={width} height={h}>
            <Path d={area} fill={colors.brand.tint} />
            <Path
              d={line}
              stroke={colors.brand.secondary}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {trend.map((p, i) => (
              <Circle
                key={p.month}
                cx={x(i)}
                cy={y(p.average)}
                r={i === trend.length - 1 ? 5 : 3}
                fill={
                  i === trend.length - 1 ? colors.brand.primary : colors.surface
                }
                stroke={colors.brand.secondary}
                strokeWidth={2}
              />
            ))}
          </Svg>
        )}
      </View>
      <View style={styles.labels}>
        {trend.map((p) => (
          <View key={p.month} style={styles.label}>
            <Text variant="caption" tone="secondary">
              {monthLabel(p.month, i18n.language)}
            </Text>
            <Text variant="caption">{p.average.toFixed(1)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing[8] },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chart: { height: premium.trendHeight },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { alignItems: 'center', minWidth: spacing[32] },
});
