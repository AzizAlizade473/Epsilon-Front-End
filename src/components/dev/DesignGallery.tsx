import { useState } from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { GalleryControls } from './GalleryControls';
import { GalleryFeedback } from './GalleryFeedback';
import { galleryCopy, type GalleryLanguage } from './galleryCopy';

import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';

const variants = [
  'display',
  'title1',
  'title2',
  'headline',
  'body',
  'callout',
  'caption',
] as const;

export function DesignGallery() {
  const [language, setLanguage] = useState<GalleryLanguage>('az');
  const [visible, setVisible] = useState(false);
  const copy = galleryCopy[language];
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Screen title={copy.title}>
        <SegmentedControl
          label={copy.language}
          value={language}
          onValueChange={setLanguage}
          options={[
            { value: 'az', label: copy.az },
            { value: 'en', label: copy.en },
            { value: 'ru', label: copy.ru },
          ]}
        />
        <Text variant="title2" accessibilityRole="header">
          {copy.typography}
        </Text>
        {variants.map((variant) => (
          <Text key={variant} variant={variant}>
            {copy.sample}
          </Text>
        ))}
        <GalleryControls copy={copy} onAction={() => setVisible(true)} />
        <GalleryFeedback
          copy={copy}
          visible={visible}
          onShow={() => setVisible(true)}
          onDismiss={() => setVisible(false)}
        />
      </Screen>
    </SafeAreaProvider>
  );
}
