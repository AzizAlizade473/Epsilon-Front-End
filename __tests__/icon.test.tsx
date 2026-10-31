import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';

test('a standalone icon exposes its supplied label to assistive technology', async () => {
  await render(<Icon icon={ArrowLeft} accessibilityLabel="Back" />);
  expect(screen.getByRole('image', { name: 'Back' })).toBeOnTheScreen();
});

test('a decorative icon does not duplicate an adjacent accessible label', async () => {
  await render(
    <>
      <Icon icon={ArrowLeft} decorative />
      <Text accessibilityRole="header">Title</Text>
    </>,
  );
  expect(screen.queryByRole('image')).toBeNull();
  expect(screen.getByRole('header', { name: 'Title' })).toBeOnTheScreen();
});
