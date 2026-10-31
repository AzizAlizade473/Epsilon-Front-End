import { expect, test } from '@jest/globals';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, typography } from '@/design';

test('Text uses system body typography and unrestricted font scaling', () => {
  const element = Text({ children: 'Body' });
  expect(element.props.allowFontScaling).toBe(true);
  expect(element.props.maxFontSizeMultiplier).toBe(0);
  expect(StyleSheet.flatten(element.props.style)).toMatchObject({
    ...typography.body,
    color: colors.ink,
  });
});

test('Text forwards native accessibility props and supports token variants', () => {
  const element = Text({
    children: 'Title',
    variant: 'title1',
    tone: 'secondary',
    accessibilityRole: 'header',
    accessibilityLabel: 'Page title',
    selectable: true,
  });
  expect(element.props).toMatchObject({
    children: 'Title',
    accessibilityRole: 'header',
    accessibilityLabel: 'Page title',
    selectable: true,
  });
  expect(StyleSheet.flatten(element.props.style)).toMatchObject({
    ...typography.title1,
    color: colors.inkSecondary,
  });
});
