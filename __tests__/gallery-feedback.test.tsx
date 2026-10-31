import { expect, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { GalleryFeedback } from '@/components/dev/GalleryFeedback';
import { galleryCopy } from '@/components/dev/galleryCopy';

test('gallery retry and dismissal demonstrate feedback without network data', async () => {
  const copy = galleryCopy.az;
  function Preview() {
    const [visible, setVisible] = useState(false);
    return (
      <GalleryFeedback
        copy={copy}
        visible={visible}
        onShow={() => setVisible(true)}
        onDismiss={() => setVisible(false)}
      />
    );
  }
  await render(<Preview />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: copy.retry }));
  expect(screen.getByText(copy.toastMessage)).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: copy.dismiss }));
  expect(screen.queryByText(copy.toastMessage)).toBeNull();
});
