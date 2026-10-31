import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import { GalleryControls } from '@/components/dev/GalleryControls';
import { galleryCopy } from '@/components/dev/galleryCopy';

test('gallery chip and switch samples are interactive', async () => {
  const copy = galleryCopy.az;
  await render(<GalleryControls copy={copy} onAction={jest.fn()} />);
  const user = userEvent.setup();
  await user.press(
    screen.getByRole('button', { name: copy.chipLabel, selected: false }),
  );
  expect(screen.getByRole('button', { name: copy.chipLabel })).toBeSelected();
  expect(
    screen.getByRole('switch', { name: copy.switchLabel, checked: false }),
  ).toBeOnTheScreen();
  await user.type(screen.getByLabelText(copy.inputLabel), 'Preview');
  expect(screen.getByLabelText(copy.inputLabel)).toHaveDisplayValue('Preview');
});
