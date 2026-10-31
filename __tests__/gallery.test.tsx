import { expect, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DesignGallery } from '@/components/dev/DesignGallery';
import { galleryCopy } from '@/components/dev/galleryCopy';

test('gallery defaults to AZ and switches all visible copy to EN and RU', async () => {
  const metrics = {
    frame: { x: 0, y: 0, width: 360, height: 640 },
    insets: { top: 24, bottom: 24, left: 0, right: 0 },
  };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <DesignGallery />
    </SafeAreaProvider>,
  );
  const user = userEvent.setup();
  expect(
    screen.getByRole('header', { name: galleryCopy.az.title }),
  ).toBeOnTheScreen();
  for (const language of ['en', 'ru'] as const) {
    const copy = galleryCopy[language];
    await user.press(screen.getByRole('radio', { name: copy[language] }));
    expect(screen.getByRole('header', { name: copy.title })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: copy.retry })).toBeOnTheScreen();
  }
});
